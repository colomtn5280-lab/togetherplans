/**
 * AfterDarkPage.tsx
 * 
 * After Dark category discovery page.
 * Displays the Suggestions/Discover interface filtered to After Dark items.
 */

import { SuggestionsPage } from './SuggestionsPage';

/**
 * After Dark page
 * Routes: /discover, /after-dark, /groups/:groupId/after-dark
 */
export const AfterDarkPage = () => {
  return <SuggestionsPage />;
};

export default AfterDarkPage;
