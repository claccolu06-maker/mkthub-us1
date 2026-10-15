import { z } from 'zod';

/** Cursos disponibles en el piloto. Para abrir otro curso basta con añadirlo aquí. */
export const COURSE_OPTIONS = [{ value: 'marketing', label: 'Marketing' }] as const;

export const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
] as const;

export const COURSE_LABELS: Record<string, string> = { marketing: 'Marketing' };
export const SHIFT_LABELS: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde' };

const USERNAME_MESSAGE = 'El nombre de usuario debe tener entre 2 y 40 caracteres.';

/**
 * Nombre de usuario: se recorta, se quita un «@» inicial y se vuelve a recortar.
 * El límite de 2–40 se aplica al valor ya normalizado, así que «@» + 40 caracteres es válido.
 * Admite espacios internos y tildes.
 */
export const UsernameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, '').trim())
  .pipe(
    z
      .string()
      .min(2, USERNAME_MESSAGE)
      .max(40, USERNAME_MESSAGE)
      .regex(/^[^\p{Cc}]+$/u, 'El nombre de usuario no puede incluir saltos de línea ni caracteres de control.'),
  );

export const EmailSchema = z.string().trim().toLowerCase().email('Escribe un correo válido.').max(254, 'El correo es demasiado largo.');

export const RegistrationProfileSchema = z.object({
  username: UsernameSchema,
  fullName: z.string().trim().min(2, 'Escribe tu nombre y apellidos.').max(120, 'El nombre es demasiado largo.'),
  course: z.literal('marketing', { errorMap: () => ({ message: 'Selecciona el curso de Marketing.' }) }),
  shift: z.enum(['morning', 'afternoon'], { errorMap: () => ({ message: 'Selecciona el turno de mañana o tarde.' }) }),
  reason: z
    .string()
    .trim()
    .min(10, 'Cuéntanos un poco más sobre ti (mínimo 10 caracteres).')
    .max(500, 'La presentación admite hasta 500 caracteres.'),
});

export const RegistrationFormSchema = RegistrationProfileSchema.extend({ email: EmailSchema });

/** Recuperar una solicitud ya enviada: mismo correo y mismo nombre de usuario. */
export const ClaimSchema = z.object({ email: EmailSchema, username: UsernameSchema });

export type RegistrationProfile = z.infer<typeof RegistrationProfileSchema>;
export type RegistrationForm = z.infer<typeof RegistrationFormSchema>;
export type RegistrationField = keyof RegistrationForm;

/**
 * Clave de comparación de nombres de usuario: sin «@», sin espacios en los extremos y sin distinguir mayúsculas.
 * Se compara en código (no con ILIKE), así «%» y «_» son caracteres normales y la comparación es exacta.
 */
export function usernameKey(value: string): string {
  return value.replace(/^@/, '').trim().toLocaleLowerCase('es');
}
