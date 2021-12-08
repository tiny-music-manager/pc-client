import React from "react"
import ReactDOM from 'react-dom'


interface ICreateDialogOption {
	okText?: string
	cancelText?: string
	className?: string
}

interface IDialogProps {
	title: string
	content: JSX.Element | string
	onClose?: () => any
	onOK?: () => any
	option?: ICreateDialogOption
}

interface IDialogHandler {
	/** 需要将此属性绑定到根元素上 */
	rootRef: any
	/** 关闭窗口并返回 */
	close(ret: boolean): any
	/** 设置校验器 */
	set validator(func: () => boolean)
	/** 更新对话框 */
	update(): void
}


export class DialogContent<P = {}, S = {}> extends React.Component<P, S> {

	constructor(props: any) {
		super(props)
		//绑定this
		const d = this.#dialogState as any
		['rootRef', 'close'].forEach(key => d[key] = (typeof d[key] == 'function') ? d[key].bind(d) : d[key])
	}

	//对话框操作
	#dialogState: IDialogHandler & { that: DialogContent, dom: HTMLElement | null, dlg: Dialog | null } = {
		dom: null,
		that: this,
		get dlg() {
			return (this.dom as any)?.$$dlg
		},
		rootRef(dom: any) {
			if (dom) this.dom = dom
		},
		close(ret: boolean) {
			if (!this.dlg) return
			if (ret) this.dlg.props.onOK?.()
			else this.dlg.props.onClose?.()
		},
		set validator(func: () => boolean) {
			setTimeout(() => {
				if (!this.dlg) return
				this.dlg.validator = func
				this.update()
			}, 1);
		},
		update() {
			this.dlg?.forceUpdate()
			this.that.forceUpdate()
		}
	}

	protected get dialog(): IDialogHandler {
		return this.#dialogState
	}
}

class Dialog extends React.Component<IDialogProps> {
	private dom = React.createRef<HTMLDivElement>()
	private rect: DOMRect | null = null
	private pos: { [K in 'dx' | 'dy' | 'ox' | 'oy']: number } | null = null

	//数据校验，当校验成功时OK按钮才会显示
	public validator: () => any = () => true

	// private body = React.createRef<HTMLDivElement>()

	handleMouseDown(e: MouseEvent) {
		if (!this.dom.current) return
		this.rect = this.dom.current.getBoundingClientRect()
		this.pos = { dx: e.clientX, dy: e.clientY, ox: e.offsetX, oy: e.offsetY }
	}

	handleMouseUp(e: MouseEvent) {
		this.rect = null
		this.pos = null
	}

	handleMouseMove(e: MouseEvent) {
		if (!this.rect || !this.pos || !this.dom.current) return
		const { dx, dy } = this.pos
		const dom = this.dom.current

		let x = e.clientX - (dx - this.rect.left)
		let y = e.clientY - (dy - this.rect.top)

		if (x < 0) x = 0
		if (y < 0) y = 0
		if (x + this.rect.width > window.innerWidth) x = window.innerWidth - this.rect.width
		if (y + this.rect.height > window.innerHeight) y = window.innerHeight - this.rect.height

		dom.style.left = x + 'px'
		dom.style.top = y + 'px'
	}

	componentDidMount() {
		window.addEventListener('mouseup', this.handleMouseUp.bind(this))
		window.addEventListener('mousemove', this.handleMouseMove.bind(this))
		// const body: any = this.body.current
		// if (!body) return
		// body.firstElementChild!.$$dlg = this
	}

	componentWillUnmount() {
		window.removeEventListener('mouseup', this.handleMouseUp.bind(this))
		window.removeEventListener('mousemove', this.handleMouseMove.bind(this))
	}

	render() {
		const { option } = this.props
		return (
			<div className={`dialog ${option?.className || ''}`} ref={this.dom}>
				<div className="dialog-title">
					<div className="title-text" onMouseDown={e => { this.handleMouseDown(e.nativeEvent) }}>{this.props.title}</div>
					<div className="close-btn" onClick={() => this.props.onClose?.()}>
						<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
							<path d="M507.168 473.232L716.48 263.936a16 16 0 0 1 22.624 0l11.312 11.312a16 16 0 0 1 0 22.624L541.12 507.168 750.4 716.48a16 16 0 0 1 0 22.624l-11.312 11.312a16 16 0 0 1-22.624 0L507.168 541.12 297.872 750.4a16 16 0 0 1-22.624 0l-11.312-11.312a16 16 0 0 1 0-22.624l209.296-209.312-209.296-209.296a16 16 0 0 1 0-22.624l11.312-11.312a16 16 0 0 1 22.624 0l209.296 209.296z"></path>
						</svg>
					</div>
				</div>
				<div className="dialog-body" ref={dom => {
					if (!dom || !dom.firstElementChild) return
					(dom.firstElementChild as any).$$dlg = this
				}}>
					{this.props.content}
				</div>
				{(option?.okText === '' && option?.cancelText === '') ? null : <div className="dialog-btns">
					{option?.cancelText === '' ? null : <div className="cancel" onClick={() => this.props.onClose?.()}>{option?.cancelText || '取消'}</div>}
					{option?.okText === '' ? null : <div className={`ok button ${this.validator() ? '' : 'disabled'}`} onClick={() => this.validator() && this.props.onOK?.()}>{option?.okText || '确定'}</div>}
				</div>}
			</div>
		)
	}
}


export function createDialog(title: string, content: JSX.Element | string, option?: ICreateDialogOption) {
	//创建dom
	const dom = document.createElement('div')
	dom.className = 'popover'
	document.body.appendChild(dom)

	let onClose: IDialogProps['onClose']
	let onOk: IDialogProps['onOK']

	const close = () => {
		ReactDOM.unmountComponentAtNode(dom)
		document.body.removeChild(dom)
	}

	//渲染
	ReactDOM.render(<Dialog
		{...{ title, content, option }}
		onOK={() => {
			if (onOk) onOk()
			close()
		}}
		onClose={() => {
			if (onClose) onClose()
			close()
		}}
	/>, dom)

	let waiting = false

	//相关操作
	return {
		close() {
			close()
		},
		set onclose(cb: typeof onClose) {
			if (waiting) return
			onClose = cb
		},
		set onok(cb: typeof onOk) {
			if (waiting) return
			onOk = cb
		},
		wait(): Promise<boolean> {
			return new Promise(resolve => {
				this.onclose = () => resolve(false)
				this.onok = () => resolve(true)
				waiting = true
			})
		}
	}
}