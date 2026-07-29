import { useQuery } from '@tanstack/react-query';
import { getFamily, getChildren } from '@/services/childService';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { useEffect } from 'react';

export function useChildData() {
  const { session } = useAuthStore();
  const setFamily = useFamilyStore((state) => state.setFamily);
  const setChildren = useFamilyStore((state) => state.setChildren);
  const setSelectedChildId = useFamilyStore((state) => state.setSelectedChildId);
  const selectedChildId = useFamilyStore((state) => state.selectedChildId);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['family-data', session?.user.id],
    queryFn: async () => {
      const family = await getFamily();
      if (!family) return { family: null, children: [] };
      const children = await getChildren(family.id);
      return { family, children };
    },
    enabled: !!session?.user.id,
  });

  useEffect(() => {
    if (data?.family) {
      setFamily(data.family);
      setChildren(data.children);
      
      // Auto-select first child if none selected
      if (!selectedChildId && data.children.length > 0) {
        setSelectedChildId(data.children[0].id);
      }
    }
  }, [data, setFamily, setChildren, selectedChildId, setSelectedChildId]);

  return {
    family: data?.family ?? null,
    children: data?.children ?? [],
    isLoading,
    error,
    refetch,
  };
}
