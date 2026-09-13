import os
import glob
import re

def update_theme():
    # Define replacements (order matters for substring overlaps!)
    replacements = [
        (r'bg-slate-950', 'bg-slate-50'),
        (r'bg-slate-900', 'bg-white'),
        (r'bg-slate-800/80', 'bg-white'),
        (r'bg-slate-800/50', 'bg-white'),
        (r'bg-slate-800/40', 'bg-white'),
        (r'bg-slate-800', 'bg-white'),
        
        (r'border-slate-800', 'border-slate-200'),
        (r'border-slate-700/50', 'border-slate-200/50'),
        (r'border-slate-700', 'border-slate-200'),
        
        (r'text-slate-100', 'text-slate-900'),
        (r'text-slate-200', 'text-slate-700'),
        (r'text-slate-300', 'text-slate-600'),
        (r'text-slate-400', 'text-slate-500'),
        (r'text-white', 'text-slate-900'),
        
        (r'hover:bg-slate-800', 'hover:bg-blue-50'),
        (r'hover:bg-slate-700', 'hover:bg-slate-100'),
        
        (r'bg-slate-700', 'bg-slate-100'),
        
        # Switch indigo/purple accents to blue
        (r'indigo-600', 'blue-600'),
        (r'indigo-500', 'blue-500'),
        (r'purple-600', 'blue-700'),
        (r'purple-500', 'blue-600'),
    ]

    files = glob.glob('frontend/src/**/*.jsx', recursive=True) + glob.glob('frontend/src/**/*.css', recursive=True)
    
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            # We use basic string replace for classes to avoid complex regex issues,
            # but we'll use regex for exact matches to avoid replacing "bg-slate-9000" if it existed.
            # Easiest is just replace the exact substrings since Tailwind class names are standard.
            new_content = new_content.replace(old.replace('\\', ''), new)
            
        # Exception: Button.jsx needs 'text-white' back for primary/danger buttons
        if 'Button.jsx' in filepath:
            new_content = new_content.replace('bg-blue-600 hover:from-blue-500 hover:to-blue-600 text-slate-900', 'bg-blue-600 hover:from-blue-500 hover:to-blue-600 text-white')
            new_content = new_content.replace('bg-red-600 hover:bg-red-500 text-slate-900', 'bg-red-600 hover:bg-red-500 text-white')
            
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

if __name__ == '__main__':
    update_theme()
