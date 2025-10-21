import React, { useState } from 'react';
import { Todo } from '../types';
import { ClipboardDocumentCheckIcon, TrashIcon } from './Icons';

interface Props {
  todos: Todo[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

const TodoItem: React.FC<{
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ todo, onToggle, onDelete }) => {
  return (
    <li className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border group">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="h-5 w-5 rounded bg-dark-border text-brand-primary focus:ring-brand-primary border-dark-border"
        />
        <span className={`transition-colors ${todo.completed ? 'text-dark-text-secondary line-through' : 'text-dark-text-primary'}`}>
          {todo.text}
        </span>
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-dark-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Eliminar tarea ${todo.text}`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </li>
  );
};


const Module5TodoList: React.FC<Props> = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) => {
  const [newTodoText, setNewTodoText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAddTodo(newTodoText.trim());
      setNewTodoText('');
    }
  };

  return (
    <div className="p-6 bg-dark-card rounded-lg border border-dark-border">
      <h2 className="text-xl font-bold text-brand-secondary mb-4 flex items-center gap-3">
        <ClipboardDocumentCheckIcon className="w-8 h-8"/>
        Módulo 5: Lista de Tareas
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Añadir una nueva tarea..."
          className="flex-grow p-3 bg-dark-bg border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-500"
          disabled={!newTodoText.trim()}
        >
          Agregar
        </button>
      </form>

      {todos.length > 0 ? (
        <ul className="space-y-3">
          {todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} onToggle={onToggleTodo} onDelete={onDeleteTodo} />
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 px-6 bg-dark-bg rounded-lg border-2 border-dashed border-dark-border">
          <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto text-dark-text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-dark-text-secondary">No hay tareas pendientes.</h3>
          <p className="mt-1 text-dark-text-secondary/70">Añade una nueva tarea para empezar.</p>
        </div>
      )}
    </div>
  );
};

export default Module5TodoList;