import type { Core } from '@strapi/strapi';

/**
 * Generates the frontend preview pathname for a given content type and document.
 * Returns null for content types that don't have a corresponding frontend page.
 */
const getPreviewPathname = (
  uid: string,
  { locale, document }: { locale?: string; document: Record<string, unknown> },
): string | null => {
  const slug = document.slug as string | undefined;
  const localPrefix = locale ? `/${locale}` : '';

  switch (uid) {
    case 'api::new.new': {
      if (!slug) return `${localPrefix}/news`;
      return `${localPrefix}/news/${slug}`;
    }
    case 'api::article.article': {
      if (!slug) return `${localPrefix}/blog`;
      return `${localPrefix}/blog/${slug}`;
    }
    default:
      return null;
  }
};

export default ({ env }: Core.Config.Shared.ConfigParams) => {
  const clientUrl = env('CLIENT_URL');
  const previewSecret = env('PREVIEW_SECRET');

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY'),
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
    preview: {
      enabled: true,
      config: {
        allowedOrigins: [clientUrl],
        async handler(
          uid: string,
          { documentId, locale, status }: { documentId: string; locale?: string; status: string },
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const document = await (strapi as any).documents(uid).findOne({ documentId });
          const pathname = getPreviewPathname(uid, { locale, document });

          if (!pathname) return null;

          const params = new URLSearchParams({ url: pathname, secret: previewSecret, status });
          return `${clientUrl}/api/preview?${params}`;
        },
      },
    },
  } as Core.Config.Admin;
};
