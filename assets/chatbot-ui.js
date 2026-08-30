document.addEventListener('DOMContentLoaded', () => {
    const chatButton = document.getElementById('chatbot-button');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const messages = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    if (!chatButton || !chatWindow || !closeBtn || !messages || !input || !sendBtn) {
        return;
    }

    let currentCategory = null; // 現在の会話カテゴリーを一時記憶
    let previousBodyOverflow = '';

    function openChat() {
        chatWindow.style.display = 'flex';
        chatWindow.setAttribute('aria-hidden', 'false');
        chatWindow.setAttribute('aria-modal', window.matchMedia('(max-width: 480px)').matches ? 'true' : 'false');
        chatButton.style.display = 'none';
        chatButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('chatbot-open');
        previousBodyOverflow = document.body.style.overflow;
        if (window.matchMedia('(max-width: 480px)').matches) {
            document.body.style.overflow = 'hidden';
        }
    }

    function closeChat() {
        chatWindow.style.display = 'none';
        chatWindow.setAttribute('aria-hidden', 'true');
        chatButton.style.display = 'flex';
        chatButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('chatbot-open');
        document.body.style.overflow = previousBodyOverflow;
        chatButton.focus();
    }

    // チャットを開く
    chatButton.addEventListener('click', async () => {
        openChat();

        // 初回のみデータ読み込みと初期メッセージ表示
        if (messages.children.length === 0) {
            await loadFaqData();
            showDisclaimer();
            showInitialMenu();
        }
        closeBtn.focus();
    });

    // チャットを閉じる
    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.style.display === 'flex') {
            closeChat();
        }
    });

    // 送信ボタン
    sendBtn.addEventListener('click', handleSend);

    // Enterキーで送信
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        // 文字数チェック
        if (text.length > MAX_INPUT_LENGTH) {
            appendBotMessage(`申し訳ありません。入力は${MAX_INPUT_LENGTH}文字以内でお願いします。`);
            return;
        }

        // ユーザーのメッセージを表示
        appendMessage('user', text);
        input.value = '';

        // 検索処理
        const result = searchAnswer(text, currentCategory);

        setTimeout(() => {
            if (result.type === "found") {
                currentCategory = result.faq.category;
                appendBotAnswer(result.faq);
            } else if (result.type === "ambiguous") {
                showDisambiguation(result.candidates);
            } else {
                appendBotMessage('申し訳ありません。ご質問に合う回答を見つけられませんでした。');
                showNotFoundOptions();
            }
        }, 500);
    }

    // テキストメッセージを追加（textContentで安全に出力）
    function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // ボットのメッセージ（HTML許可 ※JSON由来のみ）
    function appendBotMessage(html) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = html;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // 検索結果を表示
    function appendBotAnswer(faq) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message bot';

        const title = document.createElement('p');
        title.innerHTML = `<strong>${escapeHtml(faq.title)}</strong>`;
        wrapper.appendChild(title);

        const body = document.createElement('p');
        body.innerHTML = faq.answer; // JSONデータ由来（管理者が管理）
        wrapper.appendChild(body);

        if (faq.link) {
            const link = document.createElement('a');
            link.href = faq.link;
            link.className = 'action-link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = faq.linkText || '詳細はこちら';
            wrapper.appendChild(link);
        }

        // 関連する質問（id参照方式）
        if (faq.related && faq.related.length > 0) {
            const relLabel = document.createElement('p');
            relLabel.style.cssText = 'margin-top:10px; font-size:12px; color:#666;';
            relLabel.textContent = '関連する質問：';
            wrapper.appendChild(relLabel);

            faq.related.forEach(relatedId => {
                const relatedFaq = findFaqById(relatedId);
                if (!relatedFaq) return;
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = relatedFaq.title;
                btn.onclick = () => {
                    appendMessage('user', relatedFaq.title);
                    currentCategory = relatedFaq.category;
                    setTimeout(() => appendBotAnswer(relatedFaq), 500);
                };
                wrapper.appendChild(btn);
            });
        }

        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    // 聞き返し（複数候補を提示）
    function showDisambiguation(candidates) {
        const div = document.createElement('div');
        div.className = 'message bot';

        const p = document.createElement('p');
        p.textContent = '次のどちらについてお知りになりたいですか？';
        div.appendChild(p);

        candidates.forEach(faq => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = faq.title;
            btn.onclick = () => {
                appendMessage('user', faq.title);
                currentCategory = faq.category;
                setTimeout(() => appendBotAnswer(faq), 500);
            };
            div.appendChild(btn);
        });

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // 回答が見つからなかった場合の選択肢
    function showNotFoundOptions() {
        const div = document.createElement('div');
        div.className = 'message bot';

        const options = [
            { text: '質問を言い換える', action: () => input.focus() },
            { text: 'よくある質問を見る', action: () => showInitialMenu() },
            { text: '問い合わせる', action: () => window.open('https://will-next1.github.io/will-next/#contact', '_blank', 'noopener,noreferrer') }
        ];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = opt.text;
            btn.onclick = opt.action;
            div.appendChild(btn);
        });

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // 免責事項・注意表示
    function showDisclaimer() {
        appendBotMessage(
            '<span style="font-size:11px; color:#888;">' +
            '※このチャットは登録済みのよくある質問に回答します。AIではありません。<br>' +
            '※電話番号や個人情報は入力しないでください。<br>' +
            '※表示される料金・条件は変更になる場合があります。正式な内容はお問い合わせください。' +
            '</span>'
        );
    }

    // 初期メニュー表示
    function showInitialMenu() {
        const div = document.createElement('div');
        div.className = 'message bot';

        const p = document.createElement('p');
        p.textContent = 'ご質問をお選びいただくか、下部のフォームから直接入力してください。';
        div.appendChild(p);

        const categories = [
            { label: 'ホームページ制作', category: 'ホームページ制作' },
            { label: '美容サロンの集客支援', category: '美容サロンの集客支援' },
            { label: 'ホームページ診断', category: 'ホームページ診断' },
            { label: '料金・お支払い・契約', category: '契約・料金・支払い' },
            { label: 'AI活用サポート', category: 'AI活用サポート' }
        ];

        categories.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = item.label;
            btn.onclick = () => {
                currentCategory = item.category;
                appendMessage('user', item.label);
                setTimeout(() => showCategorySubMenu(item.category, item.label), 500);
            };
            div.appendChild(btn);
        });

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // カテゴリー選択後のサブ選択肢表示
    function showCategorySubMenu(category, displayLabel = category) {
        const faqs = getFaqsByCategory(category);
        const div = document.createElement('div');
        div.className = 'message bot';

        const p = document.createElement('p');
        p.textContent = `「${displayLabel}」について、どの内容でしょうか？`;
        div.appendChild(p);

        if (faqs.length > 0) {
            faqs.forEach(faq => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = faq.title;
                btn.onclick = () => {
                    appendMessage('user', faq.title);
                    currentCategory = faq.category;
                    setTimeout(() => appendBotAnswer(faq), 500);
                };
                div.appendChild(btn);
            });
        } else {
            const hint = document.createElement('p');
            hint.style.cssText = 'font-size:13px; color:#666;';
            hint.textContent = 'このカテゴリーの質問はまだ登録されていません。下のフォームからご質問ください。';
            div.appendChild(hint);
        }

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // HTMLエスケープ（タイトル等の安全な表示用）
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
});
