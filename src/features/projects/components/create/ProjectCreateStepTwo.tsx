import { Search } from 'lucide-react';
import type { UseProjectCreateReturn } from '../../hooks/useProjectCreate';
import { DepartmentDetailsFields } from './DepartmentDetailsFields';

interface ProjectCreateStepTwoProps {
    controller: UseProjectCreateReturn;
}

export function ProjectCreateStepTwo({ controller }: ProjectCreateStepTwoProps) {
    const {
        createForm,
        personnelQuery,
        personnel,
        departmentPersonnel,
        filteredPersonnel,
        selectedDepartmentName,
        selectedMemberIds,
        projectContextJson,
        updateCreateField,
        toggleAssignedPersonnel,
    } = controller;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Departman Ozel Detaylar</p>
                    <DepartmentDetailsFields controller={controller} />
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Ekip Yönetimi</p>
                    <div className="space-y-2.5">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Proje Yoneticisi</label>
                            <select
                                value={createForm.projectManagerId}
                                onChange={(event) => updateCreateField('projectManagerId', event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">{personnelQuery.isLoading ? 'Personeller yükleniyor...' : 'Proje yoneticisi secin'}</option>
                                {personnel.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.firstName} {person.lastName} - {person.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Takim Lideri</label>
                            <select
                                value={createForm.teamLeadId}
                                onChange={(event) => updateCreateField('teamLeadId', event.target.value)}
                                disabled={!selectedDepartmentName}
                                className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                            >
                                <option value="">
                                    {!selectedDepartmentName
                                        ? 'Once departman secin'
                                        : departmentPersonnel.length === 0
                                            ? 'Departman personeli bulunamadı'
                                            : 'Takim lideri secin'}
                                </option>
                                {departmentPersonnel.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.firstName} {person.lastName} - {person.role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-1">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label className="block text-xs font-semibold text-gray-600">Personel Secimi</label>
                                <span className="text-[11px] font-medium text-gray-500">Secilen: {selectedMemberIds.length}</span>
                            </div>

                            <div className="relative">
                                <Search
                                    size={13}
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={createForm.personnelSearch}
                                    onChange={(event) => updateCreateField('personnelSearch', event.target.value)}
                                    placeholder="Personel ara..."
                                    className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>

                            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                                {personnelQuery.isLoading ? (
                                    <div className="px-3 py-4 text-xs text-gray-500">Personeller yükleniyor...</div>
                                ) : personnelQuery.isError ? (
                                    <div className="px-3 py-4 text-xs font-medium text-red-600">Personel listesi alinamadi.</div>
                                ) : filteredPersonnel.length === 0 ? (
                                    <div className="px-3 py-4 text-xs text-gray-500">Eslesen personel bulunamadı.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredPersonnel.map((person) => {
                                            const isChecked = createForm.assignedPersonnelIds.includes(person.id);
                                            return (
                                                <label
                                                    key={person.id}
                                                    className="flex cursor-pointer items-start gap-2 px-3 py-2.5 transition hover:bg-gray-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleAssignedPersonnel(person.id)}
                                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-gray-800">
                                                            {person.firstName} {person.lastName}
                                                        </p>
                                                        <p className="truncate text-[11px] text-gray-500">{person.email}</p>
                                                        <p className="text-[11px] text-gray-500">
                                                            {person.role} - {person.department}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </article>
            </div>

            <article className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Departman Bazli JSON Yapi</p>
                <pre className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-[11px] leading-5 text-gray-700">
                    {JSON.stringify(projectContextJson, null, 2)}
                </pre>
            </article>
        </div>
    );
}
