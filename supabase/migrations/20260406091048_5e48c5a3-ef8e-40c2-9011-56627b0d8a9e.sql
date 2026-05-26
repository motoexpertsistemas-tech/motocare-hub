
-- Move pgcrypto from public to extensions schema
DROP EXTENSION IF EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
