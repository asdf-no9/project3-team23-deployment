import React from 'react'
import '../styles/modal.css'

export default function Modal({isOpen, title, onClose, children}) {
  if(!isOpen) return null;

    return (
    <div className="modal-container">
      <div className='modal'>
        <div className='modal-header'>
          <h2>{title}</h2>
          <button className='modal-close' onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
