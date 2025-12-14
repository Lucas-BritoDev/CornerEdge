import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Users, Plus, Copy, UserPlus, Crown, Trash2, X, Check, Clock, ShoppingCart, LogOut, Send, MessageSquare, ClipboardList, TrendingUp, Settings, MoreVertical, Share2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Group, GroupMember, GroupMessage, GroupActivity, ShoppingList } from '../types';
import { storageService } from '../services/storage-service';
import { useRouter } from 'expo-router';

export default function GroupScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [group, setGroup] = useState<Group | null>(null);
    const [sharedLists, setSharedLists] = useState<ShoppingList[]>([]);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);

    // Inputs
    const [groupName, setGroupName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => { loadGroup(); }, []);

    const loadGroup = async () => {
        const stored = await AsyncStorage.getItem('@user_group');
        if (stored) {
            const parsedGroup = JSON.parse(stored);
            setGroup(parsedGroup);
            loadSharedLists(parsedGroup);
        }
    };

    const loadSharedLists = async (currentGroup: Group) => {
        const allLists = await storageService.getLists();
        // In a real app, lists would be filtered by group ID. 
        // For this mock, we'll assume all lists are shared if a group exists, or filter by 'isShared' if we added that property.
        // Let's just mock it by showing the first 3 lists as "Shared"
        setSharedLists((allLists || []).slice(0, 3));
    };

    const saveGroup = async (g: Group | null) => {
        if (g) await AsyncStorage.setItem('@user_group', JSON.stringify(g));
        else await AsyncStorage.removeItem('@user_group');
        setGroup(g);
    };

    const createGroup = async () => {
        if (!groupName.trim()) return;
        const newGroup: Group = {
            id: Date.now().toString(),
            name: groupName.trim(),
            code: Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000), // FAM-1234 format
            members: [{
                id: user?.id || '1',
                name: user?.name || 'Usuário',
                email: user?.email || '',
                isAdmin: true,
                joinedAt: Date.now(),
                avatar: user?.name?.charAt(0).toUpperCase()
            }],
            messages: [],
            activities: [{
                id: Date.now().toString(),
                type: 'join_group',
                userId: user?.id || '1',
                userName: user?.name || 'Usuário',
                content: 'criou o grupo',
                timestamp: Date.now()
            }],
            createdAt: Date.now(),
            lists: []
        };
        await saveGroup(newGroup);
        setShowCreateModal(false);
        setGroupName('');
        loadSharedLists(newGroup);
    };

    const postMessage = async () => {
        if (!newMessage.trim() || !group) return;

        const msg: GroupMessage = {
            id: Date.now().toString(),
            text: newMessage.trim(),
            userId: user?.id || '1',
            userName: user?.name || 'Usuário',
            timestamp: Date.now(),
            isCompleted: false
        };

        const updatedGroup = {
            ...group,
            messages: [msg, ...(group.messages || [])],
            activities: [{
                id: 'act_' + Date.now(),
                type: 'message' as const,
                userId: user?.id || '1',
                userName: user?.name || 'Usuário',
                content: `pediu: "${msg.text}"`,
                timestamp: Date.now()
            }, ...(group.activities || [])]
        };

        await saveGroup(updatedGroup);
        setNewMessage('');
    };

    const toggleMessageCompletion = async (msgId: string) => {
        if (!group) return;
        const messages = group.messages || [];
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return;

        const msg = messages[msgIndex];
        const isNowCompleted = !msg.isCompleted;

        const updatedMessages = [...messages];
        updatedMessages[msgIndex] = {
            ...msg,
            isCompleted: isNowCompleted,
            completedBy: isNowCompleted ? (user?.name || 'Alguém') : undefined
        };

        const updatedActivities = isNowCompleted ? [{
            id: 'act_' + Date.now(),
            type: 'complete_message' as const,
            userId: user?.id || '1',
            userName: user?.name || 'Usuário',
            content: `comprou: "${msg.text}"`,
            timestamp: Date.now()
        }, ...(group.activities || [])] : (group.activities || []);

        await saveGroup({ ...group, messages: updatedMessages, activities: updatedActivities });
    };

    const copyCode = async () => {
        if (!group) return;
        await Clipboard.setStringAsync(group.code);
        Alert.alert('Código Copiado', `O código ${group.code} foi copiado para a área de transferência.`);
    };

    const isAdmin = group?.members?.find(m => m.id === (user?.id || '1'))?.isAdmin;

    // Styling constants
    const bgColor = isDark ? '#111827' : '#F3F4F6';
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : '#1F2937';
    const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
    const borderColor = isDark ? '#374151' : '#E5E7EB';

    // Helper for Activity Icons
    const renderActivityIcon = (type: string) => {
        switch (type) {
            case 'create_list': return <ClipboardList color={colors.info} size={16} />;
            case 'complete_message': return <Check color={colors.success} size={16} />;
            case 'message': return <MessageSquare color={colors.warning} size={16} />;
            case 'add_member': return <UserPlus color={colors.purple} size={16} />;
            default: return <Clock color={mutedColor} size={16} />;
        }
    };

    // Helper for Activity Text Color
    const getActivityColor = (type: string) => {
        switch (type) {
            case 'create_list': return colors.info;
            case 'complete_message': return colors.success;
            case 'message': return colors.warning;
            case 'add_member': return colors.purple;
            default: return mutedColor;
        }
    };

    const formatTime = (isoStringOrTimestamp: number) => {
        const date = new Date(isoStringOrTimestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHrs = Math.round(diffMs / 3600000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHrs < 24) return `${diffHrs} h atrás`;
        return 'Ontem';
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerGreeting}>Olá, {user?.name?.split(' ')[0] || 'Alex'}</Text>
                    <Text style={styles.headerTitle}>Vamos às compras?</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>

                {!group ? (
                    <View style={[styles.noGroupState, { backgroundColor: cardColor }]}>
                        <Users color={colors.primary} size={48} />
                        <Text style={[styles.noGroupTitle, { color: textColor }]}>Modo Grupo</Text>
                        <Text style={[styles.noGroupText, { color: mutedColor }]}>Crie ou entre em um grupo para sincronizar listas e recados com sua família.</Text>
                        <View style={styles.noGroupButtons}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
                                <Text style={styles.primaryBtnText}>Criar Grupo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.primary }]} onPress={() => setShowJoinModal(true)}>
                                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Entrar com Código</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {/* Group ID Card */}
                        <View style={styles.groupIdCard}>
                            <View style={styles.groupIdHeader}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <View style={styles.syncBadge}>
                                    <View style={styles.syncDot} />
                                    <Text style={styles.syncText}>SINCRONIZADO</Text>
                                </View>
                            </View>

                            <View style={styles.groupMembersRow}>
                                <View style={styles.avatarsPreview}>
                                    {(group.members || []).slice(0, 3).map((m, i) => (
                                        <View key={m.id} style={[styles.avatarCircle, { backgroundColor: i === 0 ? '#84CC16' : '#60A5FA', borderColor: '#4F46E5', zIndex: 10 - i, transform: [{ translateX: i * -15 }] }]}>
                                            <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
                                        </View>
                                    ))}
                                    <TouchableOpacity style={[styles.manageButton, { transform: [{ translateX: (group.members || []).length > 0 ? ((group.members || []).length * -15) + 10 : 0 }] }]} onPress={() => setShowMembersModal(true)}>
                                        <Text style={styles.manageLengthText}>+{(group.members || []).length}</Text>
                                        <Settings color={colors.white} size={14} />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => setShowMembersModal(true)}>
                                    <Text style={styles.manageText}>Gerenciar</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.shareButton} onPress={copyCode}>
                                <Share2 color={colors.white} size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* Message Board */}
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MessageSquare color={colors.orange} size={20} />
                                <Text style={[styles.sectionTitle, { color: textColor }]}>MURAL DE RECADOS</Text>
                            </View>
                        </View>

                        <View style={[styles.messageBoard, { backgroundColor: cardColor }]}>
                            {/* Input */}
                            <View style={[styles.messageInputRow, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}>
                                <TextInput
                                    style={[styles.messageInput, { color: textColor }]}
                                    placeholder="Ex: Acabou o café..."
                                    placeholderTextColor={mutedColor}
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    onSubmitEditing={postMessage}
                                />
                                <TouchableOpacity style={styles.sendButton} onPress={postMessage}>
                                    <Send color={colors.white} size={18} />
                                </TouchableOpacity>
                            </View>

                            {/* Messages List */}
                            {(group.messages || []).slice(0, 3).map(msg => (
                                <TouchableOpacity key={msg.id} style={[styles.messageItem, { opacity: msg.isCompleted ? 0.6 : 1 }]} onPress={() => toggleMessageCompletion(msg.id)}>
                                    <View style={[styles.checkBox, { borderColor: msg.isCompleted ? colors.success : colors.border, backgroundColor: msg.isCompleted ? colors.success : 'transparent' }]}>
                                        {msg.isCompleted && <Check color={colors.white} size={12} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.messageText, { color: textColor, textDecorationLine: msg.isCompleted ? 'line-through' : 'none' }]}>{msg.text}</Text>
                                        <Text style={[styles.messageMeta, { color: mutedColor }]}>{msg.userName} • {formatTime(msg.timestamp)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Shared Lists */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Listas Compartilhadas</Text>
                            <TouchableOpacity style={styles.addListButton} onPress={() => router.push('/lists')}>
                                <Plus color={colors.primary} size={16} />
                                <Text style={styles.addListText}>Nova</Text>
                            </TouchableOpacity>
                        </View>

                        {sharedLists.map(list => (
                            <TouchableOpacity key={list.id} style={[styles.sharedListCard, { backgroundColor: cardColor }]} onPress={() => router.push(`/list/${list.id}`)}>
                                <View style={[styles.listIcon, { backgroundColor: colors.primary }]}>
                                    <ClipboardList color={colors.white} size={24} />
                                </View>
                                <View style={styles.listInfo}>
                                    <Text style={[styles.listTitle, { color: textColor }]}>{list.name}</Text>
                                    <Text style={[styles.listSub, { color: mutedColor }]}>{list.items.length} itens • {list.items.filter(i => i.completed).length} comprados</Text>
                                </View>
                                <MoreVertical color={mutedColor} size={20} />
                            </TouchableOpacity>
                        ))}

                        {/* Recent Activity */}
                        <Text style={[styles.sectionTitle, { color: textColor, marginTop: spacing.xl, marginBottom: spacing.md }]}>Atividades Recentes</Text>
                        <View style={styles.timeline}>
                            {(group.activities || []).slice(0, 10).map((act, index) => (
                                <View key={act.id} style={styles.timelineItem}>
                                    <View style={[styles.timelineLine, { backgroundColor: borderColor, height: index === (group.activities || []).length - 1 ? 0 : '100%' }]} />
                                    <View style={[styles.timelineDot, { backgroundColor: getActivityColor(act.type) }]}>
                                        <Text style={{ color: colors.white, fontSize: 10, fontWeight: 'bold' }}>{act.userName.charAt(0)}</Text>
                                    </View>
                                    <View style={[styles.timelineContent, { backgroundColor: cardColor }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={[styles.timelineUser, { color: textColor }]}>{act.userName}</Text>
                                            <Text style={[styles.timelineTime, { color: mutedColor }]}>{formatTime(act.timestamp)}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            {renderActivityIcon(act.type)}
                                            <Text style={[styles.timelineText, { color: mutedColor }]}>{act.content}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Members Modal */}
            <Modal visible={showMembersModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor, maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Membros ({(group?.members || []).length})</Text>
                            <TouchableOpacity onPress={() => setShowMembersModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>

                        {/* Invite Code Section */}
                        <View style={[styles.inviteSection, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <View style={styles.inviteIcon}><Share2 color={colors.primary} size={24} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inviteTitle, { color: textColor }]}>Convidar Membro</Text>
                                <Text style={[styles.inviteDesc, { color: mutedColor }]}>Compartilhe este código com quem mora com você.</Text>
                            </View>
                        </View>
                        <View style={styles.codeDisplay}>
                            <Text style={[styles.codeMain, { color: textColor }]}>{group?.code}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
                                <Text style={styles.copyBtnText}>Copiar Código</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={group?.members || []}
                            keyExtractor={i => i.id}
                            style={{ flex: 1 }}
                            renderItem={({ item }) => (
                                <View style={[styles.memberRow, { borderBottomColor: borderColor }]}>
                                    <View style={[styles.memberAvatarFull, { backgroundColor: item.isAdmin ? '#FCD34D' : '#E5E7EB' }]}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: item.isAdmin ? '#78350F' : '#374151' }}>{item.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.memberName, { color: textColor }]}>{item.name} {item.id === user?.id && '(Você)'}</Text>
                                        <Text style={[styles.memberEmail, { color: mutedColor }]}>{item.email}</Text>
                                    </View>
                                    {item.isAdmin && <View style={styles.adminBadge}><Text style={styles.adminText}>Admin</Text></View>}
                                </View>
                            )}
                        />

                        <TouchableOpacity style={styles.addMemberBtnSmall} onPress={copyCode}>
                            <Text style={styles.addMemberTextSmall}>+ Adicionar Novo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Create Group Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: textColor }]}>Criar Novo Grupo</Text><TouchableOpacity onPress={() => setShowCreateModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity></View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome do Grupo</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={groupName} onChangeText={setGroupName} placeholder="Ex: Casa Praia" placeholderTextColor={mutedColor} />
                        <TouchableOpacity style={styles.primaryBtn} onPress={createGroup}><Text style={styles.primaryBtnText}>Criar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Join Group Modal */}
            <Modal visible={showJoinModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: textColor }]}>Entrar em Grupo</Text><TouchableOpacity onPress={() => setShowJoinModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity></View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Código do Grupo</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={joinCode} onChangeText={setJoinCode} placeholder="Ex: FAM-1234" placeholderTextColor={mutedColor} autoCapitalize="characters" />
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => { Alert.alert('Simulação', 'Você entrou no grupo!'); setShowJoinModal(false); }}><Text style={styles.primaryBtnText}>Entrar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexDirection: 'row', alignItems: 'center' },
    menuButton: { marginRight: spacing.md },
    headerGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
    content: { padding: spacing.lg },

    // Group Card
    groupIdCard: { backgroundColor: '#4F46E5', borderRadius: 24, padding: spacing.lg, ...shadows.lg, height: 180, justifyContent: 'space-between', marginBottom: spacing.lg },
    groupIdHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    groupName: { fontSize: 28, fontWeight: '900', color: colors.white, letterSpacing: -1 },
    syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    syncText: { color: colors.white, fontSize: 12, fontWeight: 'bold', opacity: 0.9 },
    shareButton: { position: 'absolute', top: 20, right: 20, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    groupMembersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16 },
    avatarsPreview: { flexDirection: 'row', paddingLeft: 10 },
    avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    avatarText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
    manageButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', zIndex: 0 },
    manageLengthText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
    manageText: { color: colors.white, fontWeight: 'bold', marginRight: 4 },

    // Message Board
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
    messageBoard: { borderRadius: 20, padding: spacing.md, ...shadows.sm },
    messageInputRow: { flexDirection: 'row', alignItems: 'center', padding: 4, paddingLeft: 16, borderRadius: 16, marginBottom: spacing.md },
    messageInput: { flex: 1, height: 40 },
    sendButton: { width: 40, height: 40, backgroundColor: colors.orange, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    messageItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 0 },
    checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    messageText: { fontSize: 14, fontWeight: '500' },
    messageMeta: { fontSize: 12 },

    // Shared Lists
    addListButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
    addListText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
    sharedListCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 20, marginBottom: spacing.md, ...shadows.sm },
    listIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    listInfo: { flex: 1 },
    listTitle: { fontSize: 16, fontWeight: 'bold' },
    listSub: { fontSize: 12 },

    // Timeline
    timeline: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineLine: { width: 2, position: 'absolute', left: 15, top: 30, bottom: -20, opacity: 0.3 },
    timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, zIndex: 1 },
    timelineContent: { flex: 1, padding: 12, borderRadius: 16, ...shadows.xs },
    timelineUser: { fontSize: 14, fontWeight: 'bold' },
    timelineTime: { fontSize: 10 },
    timelineText: { fontSize: 13 },

    // Empty State
    noGroupState: { alignItems: 'center', padding: 40, borderRadius: 24, marginTop: 20 },
    noGroupTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
    noGroupText: { textAlign: 'center', fontSize: 14, marginBottom: 24, lineHeight: 20 },
    noGroupButtons: { width: '100%', gap: 12 },
    primaryBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
    primaryBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { borderWidth: 2, paddingVertical: 14, borderRadius: 16, alignItems: 'center', width: '100%' },
    secondaryBtnText: { fontWeight: 'bold', fontSize: 16 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },

    // Invite Modal specific
    inviteSection: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 24, alignItems: 'center', gap: 16 },
    inviteIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
    inviteTitle: { fontSize: 16, fontWeight: 'bold' },
    inviteDesc: { fontSize: 12, marginTop: 2 },
    codeDisplay: { alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 24 },
    codeMain: { fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 16 },
    copyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
    copyBtnText: { color: colors.white, fontWeight: 'bold' },

    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    memberAvatarFull: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    memberName: { fontWeight: 'bold', fontSize: 14 },
    memberEmail: { fontSize: 12 },
    adminBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    adminText: { color: '#1E40AF', fontSize: 10, fontWeight: 'bold' },
    addMemberBtnSmall: { width: '100%', paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 16, marginTop: 16 },
    addMemberTextSmall: { color: colors.primary, fontWeight: 'bold' },

    inputLabel: { fontSize: 14, marginBottom: 8 },
    modalInput: { padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 16 },
});
