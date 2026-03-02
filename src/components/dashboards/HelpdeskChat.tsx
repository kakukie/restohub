'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'

export type HelpdeskMessage = {
    id: string
    restaurantId: string
    restaurantName: string
    senderRole: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN'
    senderName: string
    message: string
    timestamp: string
    isRead: boolean
}

export default function HelpdeskChat({ role }: { role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' }) {
    const { user, restaurants, helpdeskSettings } = useAppStore()
    const [messages, setMessages] = useState<HelpdeskMessage[]>([])
    const [inputText, setInputText] = useState('')
    const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('helpdesk_messages')
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages))
        }
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, activeRestaurantId])

    // Save messages to localStorage on change
    const saveMessages = (newMessages: HelpdeskMessage[]) => {
        setMessages(newMessages)
        localStorage.setItem('helpdesk_messages', JSON.stringify(newMessages))
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || !user) return

        let targetRestoId = ''
        let targetRestoName = ''

        if (role === 'RESTAURANT_ADMIN') {
            targetRestoId = user.restaurantId || 'unknown'
            const resto = restaurants.find(r => r.id === targetRestoId)
            targetRestoName = resto?.name || user.name
        } else {
            if (!activeRestaurantId) return
            targetRestoId = activeRestaurantId
            const resto = restaurants.find(r => r.id === activeRestaurantId)
            targetRestoName = resto?.name || 'Restaurant'
        }

        const newMessage: HelpdeskMessage = {
            id: crypto.randomUUID(),
            restaurantId: targetRestoId,
            restaurantName: targetRestoName,
            senderRole: role,
            senderName: role === 'SUPER_ADMIN' ? 'Support Agent' : user.name,
            message: inputText.trim(),
            timestamp: new Date().toISOString(),
            isRead: false
        }

        saveMessages([...messages, newMessage])
        setInputText('')
    }

    // Filter messages based on role
    const currentChatMessages = messages.filter(m => {
        if (role === 'RESTAURANT_ADMIN') {
            return m.restaurantId === user?.restaurantId
        }
        return m.restaurantId === activeRestaurantId
    })

    // Get unique restaurants that have messaged
    const chatSessions = role === 'SUPER_ADMIN' ? Array.from(new Set(messages.map(m => m.restaurantId))).map(id => {
        const lastMsg = messages.filter(m => m.restaurantId === id).pop()
        const resto = restaurants.find(r => r.id === id)
        return {
            restaurantId: id,
            restaurantName: resto?.name || lastMsg?.restaurantName || 'Unknown Merchant',
            lastMessage: lastMsg?.message,
            timestamp: lastMsg?.timestamp,
            unreadCount: messages.filter(m => m.restaurantId === id && m.senderRole === 'RESTAURANT_ADMIN' && !m.isRead).length
        }
    }).sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()) : []

    const markAsRead = (restoId: string) => {
        if (role === 'SUPER_ADMIN') {
            const updated = messages.map(m =>
                (m.restaurantId === restoId && m.senderRole === 'RESTAURANT_ADMIN') ? { ...m, isRead: true } : m
            )
            saveMessages(updated)
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans">

            {/* Super Admin Sidebar */}
            {role === 'SUPER_ADMIN' && (
                <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-[#0B0F1A]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#00a669]">support_agent</span>
                            Helpdesk Inbox
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {chatSessions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No active conversations
                            </div>
                        ) : (
                            chatSessions.map(session => (
                                <button
                                    key={session.restaurantId}
                                    onClick={() => {
                                        setActiveRestaurantId(session.restaurantId)
                                        markAsRead(session.restaurantId)
                                    }}
                                    className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors relative ${activeRestaurantId === session.restaurantId ? 'bg-emerald-50 dark:bg-[#00a669]/10 border-l-4 border-l-[#00a669]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-sm truncate pr-2">{session.restaurantName}</p>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(session.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1">{session.lastMessage}</p>

                                    {session.unreadCount > 0 && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                            {session.unreadCount}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 relative">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between z-10 w-full relative">
                    {role === 'RESTAURANT_ADMIN' ? (
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-[#00a669]/20 text-[#00a669] rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">support_agent</span>
                            </div>
                            <div className="w-full">
                                <h3 className="font-bold text-sm">Meenuin Support</h3>
                                <p className="text-xs text-[#00a669] flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[#00a669]"></span> Online
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full">
                            {activeRestaurantId ? (
                                <>
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined">storefront</span>
                                    </div>
                                    <div className="w-full">
                                        <h3 className="font-bold text-sm">{chatSessions.find(s => s.restaurantId === activeRestaurantId)?.restaurantName || 'Restaurant'}</h3>
                                        <p className="text-xs text-slate-500">Merchant Helpdesk</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-500 font-medium w-full">Select a conversation</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {(role === 'SUPER_ADMIN' && !activeRestaurantId) ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <span className="material-symbols-outlined text-[64px] mb-4">forum</span>
                            <p>Select a conversation from the sidebar</p>
                        </div>
                    ) : (
                        <>
                            {currentChatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-4 opacity-50">chat_bubble</span>
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                currentChatMessages.map((msg) => {
                                    const isMe = msg.senderRole === role;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-end gap-2 max-w-[70%]">
                                                {!isMe && (
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.senderRole === 'SUPER_ADMIN' ? 'bg-[#00a669] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                        {msg.senderRole === 'SUPER_ADMIN' ? 'S' : msg.senderName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={`px-4 py-3 text-sm shadow-sm ${isMe ? 'bg-[#00a669] text-white rounded-[1.5rem] rounded-br-[0.5rem]' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] rounded-bl-[0.5rem]'}`}>
                                                    {msg.message}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 px-10">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} className="h-1 pb-4" />
                        </>
                    )}
                </div>

                {/* Chat Input */}
                {(!((role === 'SUPER_ADMIN' && !activeRestaurantId))) && (
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative z-20">
                        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-[#00a669] focus:ring-1 focus:ring-[#00a669] transition-all text-slate-900 dark:text-slate-100"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#00a669] text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[16px] -ml-0.5">send</span>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
