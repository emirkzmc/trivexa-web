/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { ToastContainer, toast as toastifyToast, type ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type SonnerToastOptions = ToastOptions & {
    duration?: number;
};

function mapOptions(options?: SonnerToastOptions): ToastOptions {
    const { duration, ...rest } = options ?? {};
    return {
        position: rest.position ?? 'top-right',
        autoClose: duration ?? rest.autoClose ?? 3000,
        closeOnClick: rest.closeOnClick ?? true,
        pauseOnHover: rest.pauseOnHover ?? true,
        draggable: rest.draggable ?? true,
        ...rest,
    };
}

export const toast = {
    success(message: ReactNode, options?: SonnerToastOptions) {
        return toastifyToast.success(message, mapOptions(options));
    },
    error(message: ReactNode, options?: SonnerToastOptions) {
        return toastifyToast.error(message, mapOptions(options));
    },
    info(message: ReactNode, options?: SonnerToastOptions) {
        return toastifyToast.info(message, mapOptions(options));
    },
    warning(message: ReactNode, options?: SonnerToastOptions) {
        return toastifyToast.warning(message, mapOptions(options));
    },
};

export function Toaster() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
        />
    );
}
