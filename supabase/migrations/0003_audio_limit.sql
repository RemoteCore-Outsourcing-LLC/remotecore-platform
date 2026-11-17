-- Audio introductions: 10 MB max, and accept the mp3 type some browsers report.
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/ogg', 'audio/aac']
where id = 'audio';
