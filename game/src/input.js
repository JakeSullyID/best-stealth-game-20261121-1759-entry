export function createInput() {
    const keys = {};
    const justPressed = {};
    const consumed = {};
    const mouse = {
        x: 0,
        y: 0,
        clicked: false,
        activeTarget: null
    };

    window.addEventListener('keydown', e => {
        if (!keys[e.code]) {
            justPressed[e.code] = true;
            consumed[e.code] = false;
        }
        keys[e.code] = true;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (consumed[e.code]) {
            justPressed[e.code] = false;
        }
    });

    const canvasContainer = document.getElementById('canvas-container');
    
    window.addEventListener('mousedown', e => {
        const canvas = document.getElementById('game');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        mouse.x = x;
        mouse.y = y;
        mouse.clicked = true;
        mouse.activeTarget = { x, y };
    });

    return {
        keys: new Proxy(keys, {
            get(target, prop) {
                const active = !!(target[prop] || justPressed[prop]);
                if (justPressed[prop]) {
                    consumed[prop] = true;
                }
                return active;
            },
            set(target, prop, value) {
                target[prop] = value;
                if (!value) {
                    justPressed[prop] = false;
                    consumed[prop] = true;
                }
                return true;
            }
        }),
        mouse,
        consumeClick() {
            const wasClicked = mouse.clicked;
            mouse.clicked = false;
            return wasClicked ? mouse.activeTarget : null;
        },
        clearClickTarget() {
            mouse.activeTarget = null;
        }
    };
}
