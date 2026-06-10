import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetGalleries,
  adminUpdateGallery,
  adminUpdatePhoto,
  adminDeletePhoto,
  adminReorderPhotos,
  signUpload,
  adminSavePhoto,
} from '../../lib/api';

function uploadToCloudinary(file, signData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', signData.apiKey);
    fd.append('timestamp', signData.timestamp);
    fd.append('signature', signData.signature);
    fd.append('folder', signData.folder);
    fd.append('colors', 'true');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`);
    xhr.send(fd);
  });
}

export default function AdminGalleryDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState([]); // [{ name, progress }]
  const [editCaption, setEditCaption] = useState(null); // { id, caption }
  const [dragOver, setDragOver] = useState(false);
  const dragSrcId = useRef(null);

  const { data: galleries, isLoading } = useQuery({
    queryKey: ['admin-galleries'],
    queryFn: adminGetGalleries,
  });

  const gallery = galleries?.find((g) => g.id === id);

  const updateGallery = useMutation({
    mutationFn: (data) => adminUpdateGallery(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-galleries'] }),
  });

  const deletePhoto = useMutation({
    mutationFn: adminDeletePhoto,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-galleries'] }),
  });

  const updatePhoto = useMutation({
    mutationFn: ({ photoId, data }) => adminUpdatePhoto(photoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-galleries'] });
      setEditCaption(null);
    },
  });

  const reorder = useMutation({
    mutationFn: (order) => adminReorderPhotos(id, order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-galleries'] }),
  });

  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!fileArr.length) return;

    setUploading(fileArr.map((f) => ({ name: f.name, progress: 0 })));

    // Process in batches of 4
    for (let i = 0; i < fileArr.length; i += 4) {
      const batch = fileArr.slice(i, i + 4);
      const signData = await signUpload();

      await Promise.all(
        batch.map(async (file, bi) => {
          const idx = i + bi;
          try {
            const result = await uploadToCloudinary(file, signData, (pct) => {
              setUploading((prev) =>
                prev.map((u, j) => (j === idx ? { ...u, progress: pct } : u))
              );
            });

            const dominantColor = result.colors?.[0]?.[0] ?? null;
            await adminSavePhoto(id, {
              cloudinaryPublicId: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              dominantColor,
            });

            await qc.invalidateQueries({ queryKey: ['admin-galleries'] });
          } catch (err) {
            console.error('Upload error:', err);
          }
        })
      );
    }

    setUploading([]);
  }, [id, qc]);

  // Drag-and-drop reorder handlers
  const handleDragStart = (photoId) => { dragSrcId.current = photoId; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (targetId) => {
    if (!dragSrcId.current || dragSrcId.current === targetId) return;
    const photos = [...(gallery?.photos ?? [])];
    const srcIdx = photos.findIndex((p) => p.id === dragSrcId.current);
    const tgtIdx = photos.findIndex((p) => p.id === targetId);
    const [moved] = photos.splice(srcIdx, 1);
    photos.splice(tgtIdx, 0, moved);
    const order = photos.map((p, i) => ({ id: p.id, sortOrder: i }));
    reorder.mutate(order);
  };

  if (isLoading) return null;
  if (!gallery) return (
    <div className="text-center py-24 opacity-40">
      <p className="text-sm tracking-widest uppercase">Gallery not found.</p>
      <Link to="/admin/galleries" className="mt-4 block text-xs underline">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <Link to="/admin/galleries" className="text-xs tracking-widest uppercase opacity-40 hover:opacity-70 transition-opacity">
            ← Galleries
          </Link>
          <h1 className="font-serif text-3xl mt-2">{gallery.title}</h1>
          <p className="text-sm opacity-40 mt-1">{gallery._count?.photos ?? gallery.photos?.length ?? 0} photos</p>
        </div>

        {/* Settings row */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          <select
            className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none"
            value={gallery.mood}
            onChange={(e) => updateGallery.mutate({ mood: e.target.value })}
          >
            <option value="LIGHT">Light mood</option>
            <option value="DARK">Dark mood</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={gallery.watermarked}
              onChange={(e) => updateGallery.mutate({ watermarked: e.target.checked })}
            />
            Watermark
          </label>

          <button
            className={`text-xs px-3 py-1.5 rounded transition-colors ${gallery.published ? 'bg-green-100 text-green-700 hover:bg-gray-100 hover:text-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}
            onClick={() => updateGallery.mutate({ published: !gallery.published })}
          >
            {gallery.published ? '✓ Published' : 'Draft'}
          </button>

          <Link
            to={`/galleries/${gallery.slug}`}
            target="_blank"
            className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Preview ↗
          </Link>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl mb-8 transition-colors ${dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer', padding: '2.5rem', textAlign: 'center' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm tracking-widest uppercase opacity-40">
          {uploading.length ? 'Uploading…' : 'Drop photos here or click to select'}
        </p>
        <p className="text-xs opacity-30 mt-1">JPG, PNG, WEBP — multiple files supported</p>
      </div>

      {/* Upload progress bars */}
      {uploading.length > 0 && (
        <div className="mb-8 space-y-2">
          {uploading.map((u, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs opacity-50 mb-1">
                <span className="truncate max-w-xs">{u.name}</span>
                <span>{u.progress}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-full transition-all duration-300"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {!gallery.photos?.length && !uploading.length && (
        <div className="text-center py-16 opacity-30">
          <p className="text-sm tracking-widest uppercase">No photos yet.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {gallery.photos?.map((photo) => (
          <div
            key={photo.id}
            draggable
            onDragStart={() => handleDragStart(photo.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(photo.id)}
            className="group relative bg-gray-50 rounded overflow-hidden"
            style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '4/3', cursor: 'grab' }}
          >
            <img src={photo.url} alt={photo.alt || ''} className="w-full h-full object-cover" />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {/* Caption edit */}
              <button
                className="text-white text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
                onClick={() => setEditCaption({ id: photo.id, caption: photo.caption || '' })}
              >
                Caption
              </button>

              {/* Set cover */}
              <button
                className="text-white text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
                onClick={() => updateGallery.mutate({ coverPhotoId: photo.id })}
                title="Set as cover"
              >
                Set Cover
              </button>

              {/* Delete */}
              <button
                className="text-red-300 text-xs bg-white/10 hover:bg-red-500/40 rounded px-3 py-1 transition-colors"
                onClick={() => {
                  if (confirm('Delete this photo?')) deletePhoto.mutate(photo.id);
                }}
              >
                Delete
              </button>
            </div>

            {/* Cover badge */}
            {gallery.coverPhotoId === photo.id && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                Cover
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Caption edit modal */}
      {editCaption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditCaption(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg mb-4">Edit Caption</h3>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={editCaption.caption}
              onChange={(e) => setEditCaption((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="Caption or location…"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 bg-black text-white rounded py-2 text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors"
                onClick={() => updatePhoto.mutate({ photoId: editCaption.id, data: { caption: editCaption.caption } })}
              >
                Save
              </button>
              <button
                className="flex-1 border border-gray-200 rounded py-2 text-sm tracking-widest uppercase hover:bg-gray-50 transition-colors"
                onClick={() => setEditCaption(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
