
import '../styles/layout.css';
import { Link } from 'react-router';

/**
 * Used to display the manager inventory
 * Will be used for adding, deleting, and editing inventory itesm
 * Only accessible by managers
 * @returns ManagerInventory component
 * @author Brayden Bailey
 */

export default function managerInventory() {
    return (
        <div className="startBody">
            <p className="startTitle"> Manager Inventory </p>
        </div>
    )
}