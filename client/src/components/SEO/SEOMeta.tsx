import { Helmet } from 'react-helmet-async';

export const SEOMeta = ({ title, description }: { title: string; description?: string }) => (
  <Helmet>
    <title>{title ? `${title} | Aladin-AI` : 'Aladin-AI'}</title>
    {description && <meta name="description" content={description} />}
    <meta property="og:title" content={title || 'Aladin-AI'} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </Helmet>
);
