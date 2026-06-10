import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetGalleries, adminCreateGallery, adminDeleteGallery, adminUpdateGallery } from '../../lib/api';

function NewGalleryModal({ onClose }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('LIGHT');

  const create = useMutation({
    mutationFn: adminCreateGallery,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-galleries'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl mb-6">New Gallery</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-1">Title *</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Weddings 2024"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-1">Description</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional subtitle"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-1">Mood</label>
            <select
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="LIGHT">Light (cream background)</option>
              <option value="DARK">Dark (charcoal background)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            className="flex-1 bg-black text-white rounded py-2 text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-40"
            disabled={!title.trim() || create.isPending}
            onClick={() => create.mutate({ title, description, mood })}
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
          <button
            className="flex-1 border border-gray-200 rounded py-2 text-sm tracking-widest uppercase hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
        {create.isError && (
          <p className="mt-3 text-red-500 text-xs">Failed to create gallery.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminGalleries() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: galleries, isLoading } = useQuery({
    queryKey: ['admin-galleries'],
    queryFn: adminGetGalleries,
  });

  const togglePublished = useMutation({
    mutationFn: ({ id, published }) => adminUpdateGallery(id, { published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-galleries'] }),
  });

  const del = useMutation({
    mutationFn: adminDeleteGallery,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-galleries'] }),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Galleries</h1>
        <button
          className="bg-black text-white px-5 py-2 text-sm tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
          onClick={() => setShowNew(true)}
        >
          + New Gallery
        </button>
      </div>

      {isLoading && <p className="opacity-40 text-sm">Loading…</p>}

      {!isLoading && !galleries?.length && (
        <div className="text-center py-24 opacity-40">
          <p className="text-sm tracking-widest uppercase">No galleries yet.</p>
          <p className="mt-2 text-xs">Create your first gallery to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries?.map((gallery) => {
          const cover = gallery.photos?.[0];
          return (
            <div key={gallery.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 group">
              {/* Cover thumbnail */}
              <Link to={`/admin/galleries/${gallery.id}`} className="block relative" style={{ aspectRatio: '4/3' }}>
                {cover ? (
                  <img src={cover.url} alt={gallery.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs tracking-widest uppercase opacity-30">No photos</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </Link>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/galleries/${gallery.id}`}
                      className="font-serif text-lg leading-tight hover:opacity-70 transition-opacity"
                    >
                      {gallery.title}
                    </Link>
                    {gallery.description && (
                      <p className="text-xs opacity-40 mt-0.5 truncate">{gallery.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-40">{gallery._count?.photos ?? 0} photos</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${gallery.mood === 'DARK' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {gallery.mood.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Published toggle */}
                    <button
                      title={gallery.published ? 'Published — click to unpublish' : 'Draft — click to publish'}
                      className={`text-xs px-2 py-1 rounded transition-colors ${gallery.published ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}
                      onClick={() => togglePublished.mutate({ id: gallery.id, published: !gallery.published })}
                    >
                      {gallery.published ? 'Live' : 'Draft'}
                    </button>

                    {/* Delete */}
                    <button
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      onClick={() => {
                        if (confirm(`Delete "${gallery.title}"? This will permanently delete all ${gallery._count?.photos ?? 0} photos.`)) {
                          del.mutate(gallery.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNew && <NewGalleryModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
