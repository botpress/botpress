/*
import classNames from "classnames";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { polyfill } from "react-lifecycles-compat";
import { AbstractPureComponent2, Classes, Position } from "../../common";
import { safeInvoke } from "../../common/utils";
import { IOverlayLifecycleProps } from "../overlay/overlay";
import { Popover } from "../popover/popover";
import { PopperModifiers } from "../popover/popoverSharedProps";

export interface IOffset {
    left: number;
    top: number;
}

interface IContextMenuState {
    isOpen: boolean;
    isDarkTheme: boolean;
    menu: JSX.Element;
    offset: IOffset;
    onClose?: () => void;
}

const POPPER_MODIFIERS: PopperModifiers = {
    preventOverflow: { boundariesElement: "viewport" },
};
const TRANSITION_DURATION = 100;

type IContextMenuProps = IOverlayLifecycleProps;

@polyfill
class ContextMenu extends AbstractPureComponent2<IContextMenuProps, IContextMenuState> {
    public state: IContextMenuState = {
        isDarkTheme: false,
        isOpen: false,
        menu: null,
        offset: null,
    };

    public render() {
        // prevent right-clicking in a context menu
        const content = <div onContextMenu={this.cancelContextMenu}>{this.state.menu}</div>;
        const popoverClassName = classNames({ [Classes.DARK]: this.state.isDarkTheme });

        // HACKHACK: workaround until we have access to Popper#scheduleUpdate().
        // https://github.com/palantir/blueprint/issues/692
        // Generate key based on offset so a new Popover instance is created
        // when offset changes, to force recomputing position.
        const key = this.state.offset == null ? "" : `${this.state.offset.left}x${this.state.offset.top}`;

        // wrap the popover in a positioned div to make sure it is properly
        // offset on the screen.
        return (
            <div className={Classes.CONTEXT_MENU_POPOVER_TARGET} style={this.state.offset}>
                <Popover
                    {...this.props}
                    backdropProps={{ onContextMenu: this.handleBackdropContextMenu }}
                    content={content}
                    enforceFocus={false}
                    key={key}
                    hasBackdrop={true}
                    isOpen={this.state.isOpen}
                    minimal={true}
                    modifiers={POPPER_MODIFIERS}
                    onInteraction={this.handlePopoverInteraction}
                    position={Position.RIGHT_TOP}
                    popoverClassName={popoverClassName}
                    target={<div />}
                    transitionDuration={TRANSITION_DURATION}
                />
            </div>
        );
    }

    public show(menu: JSX.Element, offset: IOffset, onClose?: () => void, isDarkTheme?: boolean) {
        this.setState({ isOpen: true, menu, offset, onClose, isDarkTheme });
    }

    public hide() {
        safeInvoke(this.state.onClose);
        this.setState({ isOpen: false, onClose: undefined });
    }

    private cancelContextMenu = (e: React.SyntheticEvent<HTMLDivElement>) => e.preventDefault();

    private handleBackdropContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        // React function to remove from the event pool, useful when using a event within a callback
        e.persist();
        e.preventDefault();
        // wait for backdrop to disappear so we can find the "real" element at event coordinates.
        // timeout duration is equivalent to transition duration so we know it's animated out.
        this.setTimeout(() => {
            // retrigger context menu event at the element beneath the backdrop.
            // if it has a `contextmenu` event handler then it'll be invoked.
            // if it doesn't, no native menu will show (at least on OSX) :(
            const newTarget = document.elementFromPoint(e.clientX, e.clientY);
            newTarget.dispatchEvent(new MouseEvent("contextmenu", e));
        }, TRANSITION_DURATION);
    };

    private handlePopoverInteraction = (nextOpenState: boolean) => {
        if (!nextOpenState) {
            // delay the actual hiding till the event queue clears
            // to avoid flicker of opening twice
            requestAnimationFrame(() => this.hide());
        }
    };
}

let contextMenuElement: HTMLElement;
let contextMenu: ContextMenu;
*/
import React, { FC, Fragment, SyntheticEvent, useEffect } from 'react'
import ReactDOM from 'react-dom'

import Overlay from '../Overlay'

import style from './style.scss'

const ContextMenuWrapper = ({ event, children }) => {
  const elPos = event.currentTarget.getBoundingClientRect()

  const handleToggle = e => {
    e.stopPropagation()
    removeContextMenu()
  }

  return (
    <Fragment>
      <div
        style={{ top: `${elPos.top + elPos.height}px`, left: `${elPos.left + elPos.width / 2}px` }}
        className={style.contextMenuWrapper}
      >
        {children}
      </div>
      <Overlay onClick={handleToggle} />
    </Fragment>
  )
}
const contextMenu = (e: SyntheticEvent, content: JSX.Element) => {
  e.preventDefault()
  e.stopPropagation()

  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'context-menu-container')
  body.appendChild(div)

  ReactDOM.render(<ContextMenuWrapper event={e}>{content}</ContextMenuWrapper>, div)
}

function removeContextMenu() {
  const div = document.getElementById('context-menu-container') as HTMLElement
  const body = document.getElementsByTagName('body')[0]

  body.removeChild(div)
}

export default contextMenu
