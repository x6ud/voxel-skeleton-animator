import {createRouter, createWebHashHistory} from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/skeleton-editor'
        },
        {
            path: '/skeleton-editor',
            component: () => import('./editor/SkeletonEditor.vue')
        },
    ]
});

export default router;
