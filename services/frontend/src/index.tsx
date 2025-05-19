import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from "react-router-dom";
import {ToastProvider} from "react-toast-notifications";

const baseUrl: string | any = (document.getElementsByTagName('base')[0] || {}).href;
const rootElement: HTMLElement | null = document.getElementById('root');


ReactDOM.render(
    <BrowserRouter basename={baseUrl}>
        <ToastProvider autoDismiss={true} placement='bottom-right' >
            <App/>
        </ToastProvider>
    </BrowserRouter>,
    rootElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
