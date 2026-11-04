import React from "react";
import { LaunchSidebar } from "./LaunchSidebar";
import { LaunchHero } from "./LaunchHero";
import { HotkeyPanel } from "./HotkeyPanel";
import { LaunchEmptyState } from "./LaunchEmptyState";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { LaunchToast } from "./LaunchToast";
import { useLaunchToast } from "./hooks/useLaunchToast";
import { useInstalledTrainers } from "./hooks/useInstalledTrainers";
import { useHotkeyToggles } from "./hooks/useHotkeyToggles";

export interface LaunchViewProps {
  onNavigateToDownload?: () => void;
  isActive?: boolean;
}

export const LaunchView: React.FC<LaunchViewProps> = ({
  onNavigateToDownload,
  isActive,
}) => {
  const { toast, showToast } = useLaunchToast();

  const {
    trainers,
    setTrainers,
    selectedId,
    setSelectedId,
    selectedTrainer,
    selectedUpdate,
    isLoading,
    isLaunching,
    searchQuery,
    setSearchQuery,
    filteredTrainers,
    updateMap,
    isCheckingUpdate,
    updatingId,
    isImporting,
    isEnriching,
    deleteConfirmId,
    setDeleteConfirmId,
    loadTrainers,
    handleCheckUpdates,
    handleUpdateTrainer,
    handleImportExternalTrainers,
    handleEnrichTrainer,
    handleEnrichAll,
    handleLaunchTrainer,
    handleLaunchDual,
    handleLaunchSteamOnly,
    handleOpenInstallDir,
    handleOpenTrainersRoot,
    handleDeleteTrainer,
  } = useInstalledTrainers({ isActive, showToast });

  const {
    hotkeyQuery,
    setHotkeyQuery,
    activeOptionItems,
    filteredHotkeys,
    currentToggles,
    enabledTogglesCount,
    isSyncing,
    copiedKeyIdx,
    copiedAll,
    handleToggleOption,
    handleToggleAll,
    handleSyncHotkeys,
    handleCopySingle,
    handleCopyAll,
  } = useHotkeyToggles({ selectedTrainer, setTrainers, showToast });

  return (
    <div className="flex-1 flex overflow-hidden relative select-none">
      {/* 浮动状态 Toast 提示 */}
      <LaunchToast toast={toast} />

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        show={Boolean(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteTrainer}
      />

      {/* 左侧白色边栏 */}
      <LaunchSidebar
        trainers={trainers}
        filteredTrainers={filteredTrainers}
        selectedId={selectedId}
        searchQuery={searchQuery}
        updateMap={updateMap}
        isImporting={isImporting}
        isCheckingUpdate={isCheckingUpdate}
        isEnriching={isEnriching}
        isLoading={isLoading}
        onSelectTrainer={setSelectedId}
        onSearchQueryChange={setSearchQuery}
        onImportExternal={handleImportExternalTrainers}
        onCheckUpdates={handleCheckUpdates}
        onEnrichAll={handleEnrichAll}
        onRefresh={() => loadTrainers(selectedId || undefined)}
        onOpenTrainersRoot={handleOpenTrainersRoot}
        onNavigateToDownload={onNavigateToDownload}
      />

      {/* 右侧工作区视口 */}
      <main className="wallpaper-shell flex-1 flex flex-col overflow-y-auto transition-colors duration-300">
        {!selectedTrainer ? (
          <LaunchEmptyState
            isImporting={isImporting}
            onImportExternal={handleImportExternalTrainers}
            onNavigateToDownload={onNavigateToDownload}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <LaunchHero
              trainer={selectedTrainer}
              updateInfo={selectedUpdate}
              isLaunching={isLaunching}
              isEnriching={isEnriching}
              updatingId={updatingId}
              activeOptionCount={activeOptionItems.length}
              onLaunchTrainer={handleLaunchTrainer}
              onLaunchDual={handleLaunchDual}
              onLaunchSteamOnly={handleLaunchSteamOnly}
              onEnrichTrainer={() => handleEnrichTrainer(selectedTrainer.id)}
              onUpdateTrainer={() => handleUpdateTrainer(selectedTrainer.id)}
              onOpenInstallDir={handleOpenInstallDir}
              onDeleteClick={() => setDeleteConfirmId(selectedTrainer.id)}
            />

            <HotkeyPanel
              trainer={selectedTrainer}
              activeOptionItems={activeOptionItems}
              filteredHotkeys={filteredHotkeys}
              hotkeyQuery={hotkeyQuery}
              currentToggles={currentToggles}
              enabledTogglesCount={enabledTogglesCount}
              isSyncing={isSyncing}
              isEnriching={isEnriching}
              copiedKeyIdx={copiedKeyIdx}
              copiedAll={copiedAll}
              onHotkeyQueryChange={setHotkeyQuery}
              onSyncHotkeys={handleSyncHotkeys}
              onToggleAll={handleToggleAll}
              onCopyAll={handleCopyAll}
              onCopySingle={handleCopySingle}
              onToggleOption={handleToggleOption}
              onEnrichTrainer={() => handleEnrichTrainer(selectedTrainer.id)}
            />
          </div>
        )}
      </main>
    </div>
  );
};
