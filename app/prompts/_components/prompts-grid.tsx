// app/prompts/components/prompts-grid.tsx
"use client"; // Mark as Client Component for state and interaction

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Import Shadcn Card
import { motion } from "framer-motion";
import { Copy, Edit2, Plus, Trash2 } from "lucide-react";
import { useState, FormEvent } from "react";
import { createPrompt, updatePrompt } from "@/actions/prompts-actions";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

// Define the expected structure for a prompt object
interface Prompt {
  id: number;
  name: string;
  description: string;
  content: string;
}

// Define the props the component expects
interface PromptsGridProps {
  initialPrompts: Prompt[]; // Will receive prompts from the parent page later
}

export const PromptsGrid = ({ initialPrompts }: PromptsGridProps) => {
  // Initialize component state with the data passed via props
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [copiedId, setCopiedId] = useState<number | null>(null); // For copy functionality later

  // --- State for Create/Edit Form ---
  const [isFormOpen, setIsFormOpen] = useState(false); // Dialog visibility
  const [formData, setFormData] = useState({ name: "", description: "", content: "" }); // Form field values
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state during submission
  const [error, setError] = useState<string | null>(null); // Error message state

  // --- Add State for Editing ---
  const [editingId, setEditingId] = useState<number | null>(null); // null when creating, number (ID) when editing

  // --- Event Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const resetAndCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ name: "", description: "", content: "" });
    setError(null);
    setIsSubmitting(false);
    setEditingId(null); // Reset editingId when closing/resetting
  };

  const handleEditClick = (promptToEdit: Prompt) => {
    setEditingId(promptToEdit.id); // Store the ID of the prompt being edited
    setFormData({
      name: promptToEdit.name,
      description: promptToEdit.description,
      content: promptToEdit.content,
    });
    setError(null); // Clear errors
    setIsFormOpen(true); // Open the dialog
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingId !== null) {
        // --- UPDATE PATH ---
        const updatedPrompt = await updatePrompt({ id: editingId, ...formData });
        setPrompts((prevPrompts) =>
          prevPrompts.map((p) => (p.id === editingId ? updatedPrompt : p))
        );
        console.log(`Prompt ${editingId} updated.`);
      } else {
        // --- CREATE PATH ---
        const newPrompt = await createPrompt(formData);
        setPrompts((prevPrompts) => [newPrompt, ...prevPrompts]);
        console.log(`Prompt created with ID ${newPrompt.id}.`);
      }
      resetAndCloseForm();
    } catch (err) {
      console.error("Save Prompt Error:", err);
      setError(err instanceof Error ? err.message : "Failed to save prompt.");
      setIsSubmitting(false);
    }
  };
  // --- End Handlers ---

  // Display message and create button if no prompts exist
  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
         <Button onClick={() => { /* Add create logic */ }} className="mb-6 gap-2">
           <Plus className="w-5 h-5" /> Create First Prompt
         </Button>
        <p className="text-gray-600 dark:text-gray-300">No prompts found. Get started by creating one!</p>
      </div>
    );
  }

  return (
    <>
      {/* Create Button and Dialog Setup */}
      <div className="mb-6 flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) resetAndCloseForm(); else setIsFormOpen(open); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); resetAndCloseForm(); setIsFormOpen(true); }} className="gap-2">
              <Plus className="w-5 h-5" /> Create Prompt
            </Button>
          </DialogTrigger>
          <DialogContent onInteractOutside={(e) => { if(isSubmitting) e.preventDefault();}}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Make changes to your existing prompt.' : 'Enter the details for your new prompt.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="col-span-3" disabled={isSubmitting} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} required className="col-span-3" disabled={isSubmitting} />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">Content</Label>
                <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} required className="col-span-3 min-h-[120px]" disabled={isSubmitting} />
              </div>
              {error && <p className="col-span-4 text-center text-sm text-red-500 px-6">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAndCloseForm} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Create Prompt')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Map over the prompts state array */}
        {prompts.map((prompt, index) => (
          <motion.div /* Animation wrapper */
            key={prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            {/* Shadcn Card */}
            <Card className="h-full flex flex-col bg-white dark:bg-gray-800/50 shadow-sm border border-gray-200 dark:border-gray-700/50">
              <CardContent className="pt-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-2">
                   {/* Title & Description */}
                  <div className="flex-1 min-w-0"> {/* Allow text to wrap/truncate */}
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate" title={prompt.name}>
                      {prompt.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={prompt.description}>
                      {prompt.description}
                    </p>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => handleEditClick(prompt)}> <Edit2 className="w-4 h-4" /> </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => console.log('Delete', prompt.id)}> <Trash2 className="w-4 h-4" /> </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Copy" onClick={() => console.log('Copy', prompt.id)}> <Copy className="w-4 h-4" /> </Button>
                  </div>
                </div>
                {/* Prompt Content */}
                <div className="flex-grow mt-2 bg-gray-100 dark:bg-gray-700/60 rounded p-3 overflow-auto max-h-40"> {/* Limit height and allow scroll */}
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
                    {prompt.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
};