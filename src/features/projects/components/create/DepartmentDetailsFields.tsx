import type { UseProjectCreateReturn } from '../../hooks/useProjectCreate';

interface DepartmentDetailsFieldsProps {
    controller: UseProjectCreateReturn;
}

export function DepartmentDetailsFields({ controller }: DepartmentDetailsFieldsProps) {
    const { createForm, selectedDepartmentType, updateDepartmentDetail } = controller;

    if (selectedDepartmentType === 'SOFTWARE') {
        return (
            <div className="space-y-2.5">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Repo URL</label>
                    <input
                        value={createForm.departmentDetails.software.repoUrl}
                        onChange={(event) => updateDepartmentDetail('software', 'repoUrl', event.target.value)}
                        placeholder="https://github.com/org/repo"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Teknoloji Stack</label>
                    <input
                        value={createForm.departmentDetails.software.techStack}
                        onChange={(event) => updateDepartmentDetail('software', 'techStack', event.target.value)}
                        placeholder="React, NestJS, PostgreSQL"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">API Dokumantasyonu</label>
                    <input
                        value={createForm.departmentDetails.software.apiDocumentation}
                        onChange={(event) => updateDepartmentDetail('software', 'apiDocumentation', event.target.value)}
                        placeholder="Swagger / Postman URL"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Sunucu Bilgisi</label>
                    <textarea
                        value={createForm.departmentDetails.software.serverInfo}
                        onChange={(event) => updateDepartmentDetail('software', 'serverInfo', event.target.value)}
                        placeholder="Sunucu, ortam ve deploy notlari"
                        className="min-h-[86px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </div>
        );
    }

    if (selectedDepartmentType === 'MARKETING') {
        return (
            <div className="space-y-2.5">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Hedef Kitle</label>
                    <input
                        value={createForm.departmentDetails.marketing.targetAudience}
                        onChange={(event) => updateDepartmentDetail('marketing', 'targetAudience', event.target.value)}
                        placeholder="Orn: 25-35 yas, e-ticaret ilgi alani"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Reklam Kanallari</label>
                    <input
                        value={createForm.departmentDetails.marketing.adChannels}
                        onChange={(event) => updateDepartmentDetail('marketing', 'adChannels', event.target.value)}
                        placeholder="Meta, Google, LinkedIn"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Kampanya Butcesi</label>
                    <input
                        value={createForm.departmentDetails.marketing.campaignBudget}
                        onChange={(event) => updateDepartmentDetail('marketing', 'campaignBudget', event.target.value.replace(/[^\d]/g, ''))}
                        placeholder="150000"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </div>
        );
    }

    if (selectedDepartmentType === 'PRODUCTION') {
        return (
            <div className="space-y-2.5">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Ekipman Ihtiyaci</label>
                    <textarea
                        value={createForm.departmentDetails.production.equipmentNeeds}
                        onChange={(event) => updateDepartmentDetail('production', 'equipmentNeeds', event.target.value)}
                        placeholder="Kamera, isik, ses ekipmanlari..."
                        className="min-h-[86px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Cekim Lokasyonu</label>
                    <input
                        value={createForm.departmentDetails.production.shootingLocation}
                        onChange={(event) => updateDepartmentDetail('production', 'shootingLocation', event.target.value)}
                        placeholder="Istanbul / Besiktas Studio"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Ham Dosya Yolu</label>
                    <input
                        value={createForm.departmentDetails.production.rawFilePath}
                        onChange={(event) => updateDepartmentDetail('production', 'rawFilePath', event.target.value)}
                        placeholder="\\\\server\\projects\\raw-assets"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </div>
        );
    }

    if (selectedDepartmentType === 'DESIGN') {
        return (
            <div className="space-y-2.5">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Tasarim Tool Set</label>
                    <input
                        value={createForm.departmentDetails.design.designTools}
                        onChange={(event) => updateDepartmentDetail('design', 'designTools', event.target.value)}
                        placeholder="Figma, Illustrator, After Effects"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Brand Guide</label>
                    <input
                        value={createForm.departmentDetails.design.brandGuide}
                        onChange={(event) => updateDepartmentDetail('design', 'brandGuide', event.target.value)}
                        placeholder="Drive/Notion baglantisi"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Teslim Formati</label>
                    <input
                        value={createForm.departmentDetails.design.deliveryFormat}
                        onChange={(event) => updateDepartmentDetail('design', 'deliveryFormat', event.target.value)}
                        placeholder="Figma link + PNG + SVG"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Departman Notlari</label>
            <textarea
                value={createForm.departmentDetails.general.notes}
                onChange={(event) => updateDepartmentDetail('general', 'notes', event.target.value)}
                placeholder="Bu departman icin ozel notlar..."
                className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
        </div>
    );
}
