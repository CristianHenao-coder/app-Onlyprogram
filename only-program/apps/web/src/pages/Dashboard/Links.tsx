import LinksPage from "./links/LinksPage";

/**
 * Links Component
 * 
 * This file has been refactored into modular components located in the /links/ directory.
 * The core logic and state management are now managed by LinksPage.
 * 
 * Modular components:
 * - LinksPage: Main container and state hub
 * - LinkEditor: Editor view logic and UI
 * - ButtonsList: List view of all links
 * - PreviewPane: Real-time mobile preview
 * - SecuritySection: Geoblocking and device targeting
 * - DesktopFooter / MobileNextButton: Action buttons
 * - FolderModal: Folder management
 */
export default LinksPage;