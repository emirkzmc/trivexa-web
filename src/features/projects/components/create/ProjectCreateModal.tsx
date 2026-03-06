import { X } from 'lucide-react';
import type { UseProjectCreateReturn } from '../../hooks/useProjectCreate';
import { ProjectCreateStepOne } from './ProjectCreateStepOne';
import { ProjectCreateStepTwo } from './ProjectCreateStepTwo';

interface ProjectCreateModalProps {
    controller: UseProjectCreateReturn;
}

export function ProjectCreateModal({ controller }: ProjectCreateModalProps) {
    const {
        createPanelOpen,
        createStep,
        createProjectMutation,
        setCreateStep,
        closeCreatePanel,
        handleCreateDraft,
        handleNextStep,
        handleCreateSubmit,
    } = controller;

    if (!createPanelOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                role="button"
                tabIndex={0}
                aria-label="Proje panelini kapat"
                onClick={closeCreatePanel}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        closeCreatePanel();
                    }
                }}
                className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            />

            <aside className="relative z-10 w-full max-w-[960px] max-[900px]:max-w-[96vw] max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Yeni Proje</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                1. adimda temel bilgileri, 2. adimda departman detaylari ve ekip atamalarini tamamlayin.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeCreatePanel}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-128px)] overflow-y-auto p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCreateStep(1)}
                            className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${
                                createStep === 1 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            1. Temel Bilgiler
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreateStep(2)}
                            className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${
                                createStep === 2 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            2. Detaylar ve Ekip
                        </button>
                    </div>

                    {createStep === 1 ? (
                        <ProjectCreateStepOne controller={controller} />
                    ) : (
                        <ProjectCreateStepTwo controller={controller} />
                    )}
                </div>

                <div className="border-t border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleCreateDraft}
                            disabled={createProjectMutation.isPending}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Taslak
                        </button>

                        <div className="flex items-center gap-2">
                            {createStep === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setCreateStep(1)}
                                    disabled={createProjectMutation.isPending}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Onceki
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={createStep === 1 ? handleNextStep : handleCreateSubmit}
                                disabled={createProjectMutation.isPending}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {createProjectMutation.isPending
                                    ? 'Olusturuluyor...'
                                    : createStep === 1
                                        ? 'Sonraki Adim'
                                        : 'Proje Olustur'}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
