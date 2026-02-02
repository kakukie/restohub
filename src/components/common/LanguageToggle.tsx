'use client'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { Languages } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function LanguageToggle() {
    const { language, setLanguage } = useAppStore()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Change Language">
                    <span className="text-lg">{language === 'en' ? '🇺🇸' : '🇮🇩'}</span>
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')} className="gap-2 cursor-pointer">
                    <span className="text-lg">🇺🇸</span> English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('id')} className="gap-2 cursor-pointer">
                    <span className="text-lg">🇮🇩</span> Indonesia
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
