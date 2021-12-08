import './index.scss'
import { Dialog } from "../../../../libs/dialog"
import { createTip } from '../../../../components/popover'
import { apis } from '../../../../api'

interface ILoginDialogState {
	number: string
	password: string
	logining: boolean
}

export class LoginDialog extends Dialog<{}, {}, {}, ILoginDialogState> {
	public static config = { name: 'user-login', width: 666, height: 350 }

	private async handleLogin() {
		const { number, password, logining = false } = this.state ?? {}
		if (logining) return
		//登录
		if (!number?.trim() || !password?.trim()) return createTip('账号和密码不能为空', 'error')
		const res = await apis.user.login({ number, password })
		//结果校验
		if (typeof res != 'string') return createTip('登录失败', 'error')
		//完成
		nativeApi.appdata.setUserToken(res)
		this.exit(null)
	}

	render() {
		const { number, password, logining = false } = this.state ?? {}
		return (
			<div id="login-dialog">
				<div className="left">
					<div className="bigtitle">音乐管理器</div>
					<div className="subtitle">您的个人音乐助理</div>
				</div>
				<div className="right">
					<div className="title">
						<div className="link black" onClick={() => this.exit(null)}>
							<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M562.281173 510.800685l294.996664-293.466821c13.94971-13.878079 14.020318-36.367279 0.14224-50.316989-13.913894-13.984503-36.367279-14.020318-50.316989-0.14224L512.034792 460.377272 219.528855 166.982082c-13.842263-13.878079-36.367279-13.94971-50.316989-0.071631-13.913894 13.878079-13.948687 36.403095-0.071631 50.352805L461.576587 510.587837 166.721139 803.876604c-13.94971 13.878079-14.020318 36.367279-0.14224 50.316989 6.939039 6.974855 16.084327 10.497075 25.229614 10.497075 9.073656 0 18.148335-3.451612 25.087375-10.354835l294.926056-293.360398 295.17472 296.064996c6.939039 6.974855 16.048511 10.462283 25.193799 10.462283 9.109472 0 18.184151-3.487428 25.12319-10.390651 13.913894-13.878079 13.94971-36.367279 0.071631-50.316989L562.281173 510.800685z"></path></svg>
						</div>
					</div>
					<div className="body">
						<div className="input-item">
							<div className="label">用户名</div>
							<div className="input">
								<input type="text" placeholder="请输入用户名" value={number || ''} onChange={e => this.setState({ number: e.target.value })} />
							</div>
						</div>
						<div className="input-item">
							<div className="label">密码</div>
							<div className="input">
								<input type="password" placeholder="请输入密码" value={password || ''} onChange={e => this.setState({ password: e.target.value })} />
							</div>
						</div>

						<div className="input-item">
							<div className={`btn ${logining ? 'disabled' : ''}`} onClick={this.handleLogin.bind(this)}>登录</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}