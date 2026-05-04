
// ── 0. Lightweight Markdown Parser (Enhanced for Key Points) ───────────────
export function parseMarkdown(text) {
    if (!text) return '';

    // Fix double-newlines inside lists just in case the old DB data is still there
    let cleanText = text.replace(/(?:\- (.*?))\n\n(?=\- )/gim, '- $1\n');

    let html = cleanText
        .replace(/^### (.*$)/gim, '<h4 style="margin:20px 0 8px;font-size:15px;font-weight:700;color:var(--text-main)">$1</h4>')
        .replace(/^## (.*$)/gim, '<h3 style="margin:24px 0 10px;font-size:17px;font-weight:700;color:var(--text-main)">$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        
        // Tip / Warning / Example blocks
        .replace(/^>\s?(.*$)/gim, '<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:13.5px">$1</div>')
        
        // Key Points (Bullet Lists) - Rendered as a styled Green Summary Box
        .replace(/(^[\ \t]*\- .*(\n|$))+/gim, function(match) {
            const items = match.trim().split('\n')
                .filter(item => item.trim() !== '') 
                .map(item => `<li style="margin-bottom:8px;margin-left:24px;list-style-type:disc">${item.replace(/^[\ \t]*\- /, '')}</li>`)
                .join('');
            
            return `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:16px 20px; border-radius:12px; margin: 20px 0;">
                <div style="font-weight:700; margin-bottom:12px; color:#166534; font-size:14px; display:flex; align-items:center; gap:8px;">
                     Key Points
                </div>
                <ul style="margin:0; color:#14532d; line-height:1.6;">${items}</ul>
            </div>`;
        })

        
        // Paragraph formatting
        .replace(/\n\n/gim, '</p><p style="margin-bottom:12px;color:var(--text-secondary)">');

    return `<div style="margin-bottom:16px"><p style="margin-bottom:12px;color:var(--text-secondary)">${html}</p></div>`;
}
