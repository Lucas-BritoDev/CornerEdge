import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from './storage-service';

const SYNC_QUEUE_KEY = 'offline_sync_queue';

interface SyncAction {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'list' | 'item';
    data: any;
    timestamp: number;
}

export const offlineSyncService = {
    queue: [] as SyncAction[],
    isOnline: true,

    async initialize() {
        this.loadQueue();

        NetInfo.addEventListener(state => {
            const online = !!state.isConnected;
            if (online && !this.isOnline) {
                this.processQueue();
            }
            this.isOnline = online;
        });
    },

    async loadQueue() {
        try {
            const json = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            if (json) {
                this.queue = JSON.parse(json);
            }
        } catch (e) {
            console.error('Error loading sync queue', e);
        }
    },

    async saveQueue() {
        try {
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.error('Error saving sync queue', e);
        }
    },

    async addToQueue(action: Omit<SyncAction, 'id' | 'timestamp'>) {
        const syncAction: SyncAction = {
            ...action,
            id: Date.now().toString(),
            timestamp: Date.now()
        };

        this.queue.push(syncAction);
        await this.saveQueue();

        if (this.isOnline) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (this.queue.length === 0) return;

        // console.log('Processing sync queue...', this.queue.length);

        const remainingActions: SyncAction[] = [];

        for (const action of this.queue) {
            try {
                // Here we would call the backend API
                // await api.sync(action);
                // console.log('Synced action', action.id);
            } catch (error) {
                // Keep in queue if failed
                remainingActions.push(action);
            }
        }

        this.queue = remainingActions;
        await this.saveQueue();
    }
};
