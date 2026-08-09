'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

const NAV_LINKS = [
    { label: 'Live', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'C2S Finder', href: '/c2s-finder' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Give', href: '/give' },
];

function MenuIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
            <div className="w-full px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo — pinaka-kaliwa */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-10 h-10 relative shrink-0">
                            <Image
                                src="/logo.png"
                                alt="Church of God Dasmarinas logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="leading-tight">
                            <p className="text-[13px] font-bold text-gray-800">Church of God Dasmarinas</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">CONNECT2SOULS</p>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-7">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm transition-colors ${
                                    pathname === link.href
                                        ? 'text-[#e03131] font-semibold'
                                        : 'text-gray-600 hover:text-gray-900 font-medium'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/login"
                            className="text-sm font-bold text-white bg-[#e91e8c] hover:bg-[#c2177a] px-4 py-1.5 rounded-full transition-colors"
                        >
                            Login
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                                    pathname === link.href
                                        ? 'bg-red-50 text-[#e03131]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link href="/login" onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2 rounded-md text-sm font-bold text-[#e91e8c]">
                            Login
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
