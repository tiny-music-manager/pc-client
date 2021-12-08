import './index.scss'
import React from "react"

interface ICheckBoxProps {
	checked?: boolean
	onChange?: (checked: boolean) => any
	className?: string
	style?: React.CSSProperties
}

export class CheckBox extends React.Component<ICheckBoxProps> {
	render() {
		return (
			<div className="check" onClick={e => this.props.onChange?.(!this.props.checked)}>
				<div className={`checkbox ${this.props.checked ? 'checked' : ''}`}>
					<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M200.853333 464.917333l-60.373333 60.309334 252.544 252.885333 490.496-491.114667-60.373333-60.309333-430.122667 430.656z"></path></svg>
				</div>
			</div>
		)
	}
}