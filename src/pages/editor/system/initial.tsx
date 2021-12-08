import "./initial.scss"
import { Dialog } from "../../../libs/dialog"
import { apis } from "../../../api"

interface ISystemInitialDialogState {
	number: string
	name: string
	password: string
	vpassword: string
}

export class SystemInitialDialog extends Dialog<{}, {}, {}, ISystemInitialDialogState> {
	public static config = { name: 'system-initial', width: 600, height: 360 }

	constructor(props: any) {
		super(props)
		this.state = { number: 'admin', name: 'Administrator', password: '', vpassword: '' }
	}

	private get validators() {
		const state = this.state
		return {
			get name() {
				const name = state?.name?.trim()
				if (!name?.length) return '名字不能为空'
				if (name.length > 20) return '名字太长'
				return null
			},
			get number() {
				const number = state?.number?.trim()
				if (!number?.length) return '账号不能为空'
				if (number.length < 4 || number.length > 20) return '账号长度不正确'
				if (!/^[a-zA-Z0-9]{4,}$/.test(number)) return '账号不合法'
				return null
			},
			get password() {
				const password = state?.password?.trim()
				if (!password?.length) return '密码不能为空'
				if (password.length < 6 || password.length > 20) return '密码长度不正确'
				return null
			},
			get vpassword() {
				const vpassword = state?.vpassword?.trim()
				const password = state?.password?.trim()
				if ((password && !vpassword) || (vpassword?.length && vpassword != password)) return '两次输入的密码不一致'
				return null
			},
			get ok() {
				return !(this.name || this.number || this.password || this.vpassword)
			}
		}
	}

	private async handleInitial() {
		if (!this.validators.ok) return
		const { number, name, password } = this.state
		await apis.sys.initial.save({ number, name, password })
		this.exit({})
	}

	render() {
		const { number = '', name = '', password = '', vpassword = '' } = this.state ?? {}
		return (
			<div className="app-window" id="system-initial-dialog">
				<div className="appbar">
					<div className="title">系统初始化</div>
					{/* <AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} /> */}
				</div>
				<div className="appbody">
					<div className="editor-item">
						<div className="label">管理员账号</div>
						<div className="input-area">
							<input type="text" className="input" value={number} onChange={e => this.setState({ number: e.target.value })} />
							<div className="error errtip">{this.validators.number}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">管理员名字</div>
						<div className="input-area">
							<input type="text" className="input" value={name} onChange={e => this.setState({ name: e.target.value })} />
							<div className="error errtip">{this.validators.name}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">管理员密码</div>
						<div className="input-area">
							<input type="password" className="input" value={password} onChange={e => this.setState({ password: e.target.value })} />
							<div className="error errtip">{this.validators.password}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">确认密码</div>
						<div className="input-area">
							<input type="password" className="input" value={vpassword} onChange={e => this.setState({ vpassword: e.target.value })} />
							<div className="error errtip">{this.validators.vpassword}</div>
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className={`button ${this.validators.ok ? '' : 'disabled'}`} onClick={this.handleInitial.bind(this)}>确认并初始化</div>
				</div>
			</div>
		)
	}
}