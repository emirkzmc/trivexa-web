import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportPersonnel } from '../api/personnel.api';
import type { PersonnelListParams } from '../api/personnel.api';
import { formatDate } from '../../../shared/utils/formatDate';

/**
 * Personel listesini Excel olarak indirir.
 * Blob → download link.
 */
export function useExportPersonnel() {
    return useMutation({
        mutationFn: (params: PersonnelListParams) => exportPersonnel(params),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = formatDate(new Date().toISOString(), 'file');
            link.href = url;
            link.download = `personel-listesi-${today}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Excel dosyası indiriliyor', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Dışa aktarma sırasında bir hata oluştu', { duration: 3_000 });
        },
    });
}
