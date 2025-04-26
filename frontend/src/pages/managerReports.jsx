import { useState, useEffect, useRef } from 'react';
import styles from '../styles/managerInventory.module.css';
import Cookies from 'js-cookie';
import Modal from '../components/modal';

const API_URL = import.meta.env.VITE_API_URL;

export default function ManagerReports() {

    const mainRef = useRef(null);

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const [status, setStatus] = useState('Run a Report');
    const [reportType, setReportType] = useState('');
    const [columns, setColumns] = useState([]);
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState('');

    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        mainRef.current.scrollTo(0, 0);
    }, [])

    const openInventoryModal = () => {
        if (loading) return;
        setModalMode('inventory');
    }

    const closeModal = () => {
        setModalMode('');
    }

    const runInventoryReport = (e) => {
        e.preventDefault();
        if (loading) return;
        closeModal();
        setLoading(true);
        setReportType('inventory');
        setStatus('Running Inventory Report...');
        fetch(API_URL + 'reports/inventory?to=' + toDate + "&from=" + fromDate, {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => {
                setColumns(r ? r.columns ? r.columns : [] : []);
                setReport(r ? r.report ? r.report : [] : []);
                setStatus('');
            })
            .catch((e) => {
                setStatus('Server Error');
                console.log(e);
            })
            .finally(() => setLoading(false))
    }

    const runXReport = () => {
        if (loading) return;
        setLoading(true);
        setReportType('x');
        setStatus('Running X Report...');
        fetch(API_URL + 'reports/x', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => {
                setColumns(r ? r.columns ? r.columns : [] : []);
                setReport(r ? r.report ? r.report : [] : []);
                setStatus('');
            })
            .catch((e) => {
                setStatus('Server Error');
                console.log(e);
            })
            .finally(() => setLoading(false))
    }

    const runZReport = () => {
        if (loading) return;
        setLoading(true);
        setReportType('z');
        setStatus('Running Z Report...');
        fetch(API_URL + 'reports/z', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => {
                setColumns(r ? r.columns ? r.columns : [] : []);
                setReport(r ? r.report ? r.report : [] : []);
                setStatus('');
            })
            .catch((e) => {
                setStatus('Server Error');
                console.log(e);
            })
            .finally(() => setLoading(false))
    }

    return (
        <div className="mainBody" ref={mainRef} id="mainBody">
            <div id='scaler'>
                <div className={styles.page}>
                    <div className="headerbar phoneflip header">
                        <h1>Store Reports</h1>
                        <hr className='phone' />
                        <div></div>
                        <div className={styles.actionbuttons}>
                            <button onClick={openInventoryModal} disabled={loading} className={loading ? "black" : reportType == 'inventory' ? "third" : "blue"}>Inventory Usage</button>
                            <button onClick={runXReport} disabled={loading} className={loading ? "black" : reportType == 'x' ? "third" : "blue"}>X-Report</button>
                            <button onClick={runZReport} disabled={loading} className={loading ? "black" : reportType == 'z' ? "third" : "blue"}>Z-Report</button>
                        </div>
                    </div>
                    <div className={styles.tablecontainer}>
                        {status == '' ?
                            <table>
                                <thead>
                                    <tr>
                                        {
                                            columns.map((column, idx) => {
                                                return <th key={idx}>{column}</th>
                                            })
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.map((item, idx) =>
                                        <tr key={idx} onClick={() => setSelectedRow(idx)} className={selectedRow == idx ? styles.selected : ''}>
                                            {
                                                columns.map((column, idx2) => {
                                                    return <td key={idx2}>{item[idx2]}</td>
                                                })
                                            }
                                        </tr>
                                    )}
                                </tbody>
                            </table> : <h2 className='h3 centeralign'>{status}</h2>}
                    </div>
                </div>
            </div>
            <Modal
                isOpen={modalMode !== ''}
                title={"Run Inventory Usage Report"}
                onClose={closeModal}>
                <form onSubmit={runInventoryReport} className='modal-form'>
                    <div>
                        <label htmlFor="from-date">From:</label>
                        <input
                            type="date"
                            id="from-date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            required
                        />

                        <label htmlFor="to-date">To:</label>
                        <input
                            type="date"
                            id="to-date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            required
                        />

                        <button type='submit' disabled={loading}>
                            Submit
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}