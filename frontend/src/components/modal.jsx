import React from 'react'
import modalStyle from '../styles/modal.module.css'

export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className={modalStyle.modalcontainer}>
      <div className={modalStyle.modal}>
        <div className={modalStyle.modalheader}>
          <h2>{title}</h2>
          <button className={modalStyle.modalclose} onClick={onClose}>&times;</button>
        </div>
        <div className={modalStyle.modalbody}>
          {children}
        </div>
      </div>
    </div>
  )
}
