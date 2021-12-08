import './tip.scss'

let tipN = 0

export function createTip(text: string, type: 'success' | 'error', domHandler?: (dom: HTMLDivElement) => any) {
	const dom = document.createElement('div')
	dom.className = "popover-tip"
	dom.innerHTML = `<div>${text}</div>`
	dom.style.background = type == 'success' ? '#4caf50' : '#f44336'
	domHandler?.(dom)
	document.body.appendChild(dom)

	setTimeout(() => {
		document.body.removeChild(dom)
	}, 5000);
}