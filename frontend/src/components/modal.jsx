import React from 'react'
import modalStyle from '../styles/modal.module.css'

/**
 * Used to display a modal for Manager Menu, Manager Inventory, and Manager staff
 * @param isOpen - boolean used to display the Modal
 * @param title - string used for modal title
 * @param onClose - function passed to tell what to do on close bytton click
 * @param children - page elements that will be used to collect input, later used for api calls
 * @author Brayden Bailey
 * @returns Modal component or null
 */
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
