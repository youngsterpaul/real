import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useSavedItems = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSavedItems(new Set());
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchSavedItems = async () => {
      const { data } = await supabase
        .from("saved_items")
        .select("item_id")
        .eq("user_id", user.id);
      
      if (data) {
        setSavedItems(new Set(data.map(item => item.item_id)));
      }
      setLoading(false);
    };

    fetchSavedItems();

    // Set up realtime subscription
    const channel = supabase
      .channel('saved-items-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'saved_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newItem = payload.new as { item_id: string };
          setSavedItems(prev => new Set([...prev, newItem.item_id]));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'saved_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedItem = payload.old as { item_id: string };
          setSavedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(deletedItem.item_id);
            return newSet;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSave = async (itemId: string, itemType: string) => {
    if (!user) {
      toast({ 
        title: "Login required", 
        description: "Please login to save items",
        variant: "destructive" 
      });
      return;
    }
    
    const isSaved = savedItems.has(itemId);
    
    if (isSaved) {
      await supabase
        .from("saved_items")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);
    } else {
      // Check if item already exists in database
      const { data: existing } = await supabase
        .from("saved_items")
        .select("id")
        .eq("item_id", itemId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from("saved_items")
          .insert([{ 
            user_id: user.id, 
            item_id: itemId, 
            item_type: itemType.toLowerCase()
          }]);
      }
    }
  };

  return { savedItems, loading, handleSave };
};
