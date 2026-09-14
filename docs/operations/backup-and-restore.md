# Backup and Restore

## PostgreSQL

Create a dump from the Compose service:

```text
docker compose exec -T postgres pg_dump -U np_note np_note > backups/np-note.sql
```

Restore into an empty database:

```text
type backups\np-note.sql | docker compose exec -T postgres psql -U np_note np_note
```

## Attachments

Back up the `note_storage` Docker volume or the configured `STORAGE_ROOT` directory separately from PostgreSQL. Restore it before opening attachment links after a database restore.

## Recovery check

After restoring both sources, open the Notes screen, inspect an attachment, and verify that a signed LINE fixture can still be persisted without creating a duplicate event.
