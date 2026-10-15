import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from workspace root if present, or cwd
dotenv.config({ path: '../.env' });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('documents'),
  GOOGLE_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024), // 10MB
  MAX_UPLOAD_FILES: z.coerce.number().int().positive().default(10),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300), // 5 minutes
  AI_PROCESSING_ENABLED: z
    .enum(['true', 'false', '1', '0'])
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  // In production, exit; in development or test allow inspection
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : (EnvSchema.parse({}) as z.infer<typeof EnvSchema>);
