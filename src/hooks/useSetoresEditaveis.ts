import { useState, useEffect, useCallback } from "react";
import { setores as setoresDefault, type Setor, type Tarefa } from "../pages/gestao-operacional/tarefasData";

const STORAGE_KEY = "gestao-operacional-custom";

interface CustomData {
  setores: Setor[];
}

function loadCustomData(): Setor[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: CustomData = JSON.parse(saved);
      return parsed.setores;
    }
  } catch { /* empty */ }
  return [...setoresDefault.map(s => ({ ...s, tarefas: [...s.tarefas] }))];
}

function saveCustomData(data: Setor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ setores: data }));
}

export function useSetoresEditaveis() {
  const [setoresEdit, setSetoresEdit] = useState<Setor[]>(loadCustomData);

  useEffect(() => {
    // If new default sectors were added, merge them in
    const ids = new Set(setoresEdit.map(s => s.id));
    const novos = setoresDefault.filter(s => !ids.has(s.id));
    if (novos.length > 0) {
      const merged = [...setoresEdit, ...novos.map(s => ({ ...s, tarefas: [...s.tarefas] }))];
      setSetoresEdit(merged);
      saveCustomData(merged);
    }
  }, []);

  const updateSetorNome = useCallback((setorId: string, nome: string) => {
    setSetoresEdit(prev => {
      const next = prev.map(s => s.id === setorId ? { ...s, nome } : s);
      saveCustomData(next);
      return next;
    });
  }, []);

  const updateSetorDescricao = useCallback((setorId: string, descricao: string) => {
    setSetoresEdit(prev => {
      const next = prev.map(s => s.id === setorId ? { ...s, descricao } : s);
      saveCustomData(next);
      return next;
    });
  }, []);

  const addTarefa = useCallback((setorId: string, texto: string) => {
    setSetoresEdit(prev => {
      const next = prev.map(s => {
        if (s.id !== setorId) return s;
        const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        return { ...s, tarefas: [...s.tarefas, { id: newId, texto }] };
      });
      saveCustomData(next);
      return next;
    });
  }, []);

  const removeTarefa = useCallback((setorId: string, tarefaId: string) => {
    setSetoresEdit(prev => {
      const next = prev.map(s => {
        if (s.id !== setorId) return s;
        return { ...s, tarefas: s.tarefas.filter(t => t.id !== tarefaId) };
      });
      saveCustomData(next);
      return next;
    });
  }, []);

  const editTarefa = useCallback((setorId: string, tarefaId: string, texto: string) => {
    setSetoresEdit(prev => {
      const next = prev.map(s => {
        if (s.id !== setorId) return s;
        return { ...s, tarefas: s.tarefas.map(t => t.id === tarefaId ? { ...t, texto } : t) };
      });
      saveCustomData(next);
      return next;
    });
  }, []);

  const addSetor = useCallback((nome: string, descricao: string) => {
    setSetoresEdit(prev => {
      const newId = `custom-setor-${Date.now()}`;
      const next = [...prev, { id: newId, nome, descricao, icon: "Settings", tarefas: [] }];
      saveCustomData(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = setoresDefault.map(s => ({ ...s, tarefas: [...s.tarefas] }));
    setSetoresEdit(defaults);
    saveCustomData(defaults);
  }, []);

  return {
    setores: setoresEdit,
    updateSetorNome,
    updateSetorDescricao,
    addTarefa,
    removeTarefa,
    editTarefa,
    addSetor,
    resetToDefaults,
  };
}
