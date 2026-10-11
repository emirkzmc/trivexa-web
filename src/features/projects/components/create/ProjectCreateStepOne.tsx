import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../projectsPage.constants';
import type { PriorityLevel } from '../projectsPage.types';
import type { UseProjectCreateReturn } from '../../hooks/useProjectCreate';

interface ProjectCreateStepOneProps {
    controller: UseProjectCreateReturn;
}

export function ProjectCreateStepOne({ controller }: ProjectCreateStepOneProps) {
    const {
        createForm,
        clientsQuery,
        departmentsQuery,
        clients,
        departmentOptions,
        selectedDepartmentName,
        updateCreateField,
    } = controller;

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Temel Bilgiler</p>
                <div className="space-y-2.5">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Proje Adi</label>
                        <input
                            value={createForm.name}
                            onChange={(event) => updateCreateField('name', event.target.value)}
                            placeholder="Orn: Trivexa Website Revamp"
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Müşteri</label>
                        <select
                            value={createForm.clientId}
                            onChange={(event) => updateCreateField('clientId', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">
                                {clientsQuery.isLoading
                                    ? 'Müşteriler yükleniyor...'
                                    : clientsQuery.isError
                                        ? 'Müşteriler alinamadi'
                                        : clients.length === 0
                                            ? 'Müşteri bulunamadı'
                                            : 'Müşteri secin'}
                            </option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Departman Secimi</label>
                        <select
                            value={createForm.departmentId}
                            onChange={(event) => updateCreateField('departmentId', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">
                                {departmentsQuery.isLoading ? 'Departmanlar yükleniyor...' : 'Departman secin'}
                            </option>
                            {departmentOptions.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Durum</label>
                            <select
                                value={createForm.status}
                                onChange={(event) => updateCreateField('status', event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Butce (TRY)</label>
                            <input
                                value={createForm.budget}
                                onChange={(event) => updateCreateField('budget', event.target.value.replace(/[^\d]/g, ''))}
                                placeholder="250000"
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Baslangic</label>
                            <input
                                type="date"
                                value={createForm.startDate}
                                onChange={(event) => updateCreateField('startDate', event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Teslim</label>
                            <input
                                type="date"
                                value={createForm.deadline}
                                onChange={(event) => updateCreateField('deadline', event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Açıklama</label>
                        <textarea
                            value={createForm.description}
                            onChange={(event) => updateCreateField('description', event.target.value)}
                            placeholder="Proje kapsamini, hedefleri ve teslim beklentilerini yazin..."
                            className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>
                </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Planlama ve Hiyerarsi</p>
                <div className="space-y-2.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Oncelik Durumu</label>
                            <select
                                value={createForm.priority}
                                onChange={(event) => updateCreateField('priority', event.target.value as PriorityLevel)}
                                className="h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                {PRIORITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Gorunurluk</label>
                            <button
                                type="button"
                                onClick={() => updateCreateField('isPrivate', !createForm.isPrivate)}
                                className={`inline-flex h-9 w-full items-center justify-center rounded-lg border text-sm font-semibold transition ${
                                    createForm.isPrivate
                                        ? 'border-red-300 bg-red-50 text-red-700'
                                        : 'border-gray-300 bg-white text-gray-700'
                                }`}
                            >
                                {createForm.isPrivate ? 'Gizli Proje' : 'Acik Proje'}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Ekip Boyutu</label>
                            <input
                                value={createForm.teamSize}
                                onChange={(event) => updateCreateField('teamSize', event.target.value.replace(/[^\d]/g, ''))}
                                placeholder="6"
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Tagler</label>
                            <input
                                value={createForm.tags}
                                onChange={(event) => updateCreateField('tags', event.target.value)}
                                placeholder="ui, sprint-1, launch"
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Seçili departman: <strong>{selectedDepartmentName || '-'}</strong>
                    </div>
                </div>
            </article>
        </div>
    );
}
