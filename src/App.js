import './App.css';
import {HotTable} from '@handsontable/react';
import getData from "./dataProvider";
import Handsontable from "handsontable";
import _ from 'lodash';
import React, {useState, useRef} from "react";

function App() {
    const [edit, setEdit] = useState(false);
    const hotComponent = useRef();

    const handleClick = () => {
        setEdit(!edit);
    }

    const hostItems = _.filter(getData().authorizationItems, item => item.category === 'Host');
    let homeItems = _.filter(getData().authorizationItems, item => item.category === 'Home');
    homeItems = _.map(homeItems, homeItem => {
        const editor =  'selector';
        const selectOptions = _.chain(hostItems)
            .filter(hostItem => hostItem.authorizedCountry === homeItem.authorizedCountry && hostItem.assigneeId === homeItem.assigneeId)
            .value();

        return {...homeItem, editor, selectOptions}
    });

    const data = _.concat(homeItems, hostItems);

    const editFormSetting = {
        data,
        colHeaders: ["Authorized?" ,"Assignee" ,"Assignee ID" ,"Employee ID" ,"Category" ,"Authorized Country" ,"Assignment" ,"Comments" ,"Last Updated"],
        width: "100%",
        height: "300",
        stretchH: 'all',
        columns: [
            {type: 'checkbox', data: 'isAuthorized' },
            {type: 'text', data: 'assigneeName'},
            {type: 'text', data: 'assigneeId'},
            {type: 'text', data: 'employeeId'},
            {type: 'text', data: 'category'},
            {type: 'text', data: 'authorizedCountry'},
            {
                editor: CustomEditor,
                renderer: CustomRenderer,
            },
            {type: 'text', data: 'Comments'},
            {type: 'text', data: 'lastUpdatedBy'}],
    }

    const viewFormSetting = {
        data,
        colHeaders: ["Authorized?" ,"Assignee" ,"Assignee ID" ,"Employee ID" ,"Category" ,"Authorized Country" ,"Assignment" ,"Comments" ,"Last Updated"],
        width: "100%",
        height: "300",
        columns: [
            {type: 'text', data: 'isAuthorized', renderer: (instance, td, row, col, prop, value) => {
                const icon = document.createElement("i");
                if (value) {
                    icon.className = "fa fa-check";
                }
                else {
                    icon.className = "fa fa-minus"
                }
                td.replaceChildren(icon)
            }, readOnly: true},
            {type: 'text', data: 'assigneeName', readOnly: true},
            {type: 'text', data: 'assigneeId', readOnly: true},
            {type: 'text', data: 'employeeId', readOnly: true},
            {type: 'text', data: 'category', readOnly: true},
            {type: 'text', data: 'authorizedCountry', readOnly: true},
            {
                editor: false,
                renderer: CustomRenderer, readOnly: true
            },
            {type: 'text', data: 'Comments', readOnly: true},
            {type: 'text', data: 'lastUpdatedBy', readOnly: true}],
        filters: true,
        dropdownMenu:true,
    }

    return (
        <div className="App">
            <button onClick={handleClick}>{edit ? 'edit' : 'view'}</button>
            {edit ? <HotTable {...editFormSetting}/>
            : <HotTable ref={hotComponent} {...viewFormSetting}/>}
        </div>
    );
}

function generateAssignment(data) {
    return `${data['assignmentCountry']}(${data['startDate']} - ${data['actualEndDate']})`;
}

function CustomRenderer(instance, td, row, col, prop, value, cellProperties) {
    const rowData = instance.getSourceDataAtRow(row)
    if (rowData.assignmentId !== null && rowData.assignmentId !== 0) {
        td.textContent = generateAssignment(rowData);
        return;
    }

    if (!!value) {
        const options = cellProperties.selectOptions;
        if (_.isEmpty(options)) td.textContent = "";
        const selectedOption = _.find(options, opt => opt.id === parseInt(value))
        rowData.assignmentId = selectedOption.assignmentId;
        rowData.assignmentCountry = selectedOption.assignmentCountry;
        rowData.startDate = selectedOption.startDate;
        rowData.actualEndDate = selectedOption.actualEndDate;
        td.textContent = generateAssignment(rowData);
    } else if (rowData){
        td.textContent = "";
    }
}

class CustomEditor extends Handsontable.editors.SelectEditor {
    init() {
        super.init();
        this.select.style.display = "";
    }

    prepare(row, col, prop, td, originalValue, cellProperties) {
        super.prepare(row, col, prop, td, originalValue, cellProperties);
        const rowData = cellProperties.instance.getSourceDataAtRow(row);
        if (rowData.category === 'Host') {
            cellProperties.editor = false;
            cellProperties.readOnly = true;
            return td;
        }

        if (rowData.assignmentId === null || rowData.assignmentId === 0) {
            cellProperties.selectOptions = rowData.selectOptions || [];
        }
        return td;
    };

    close() {
        super.close();
        this.select.style.display="";
    }

    prepareOptions(optionsToPrepare) {
        super.prepareOptions(optionsToPrepare);
        const preparedOptions = {
            "": "Please Select",
        };

        if (Array.isArray(optionsToPrepare)) {
            for (let i = optionsToPrepare.length - 1; i >= 0 ; i--) {
                const option = optionsToPrepare[i];
                preparedOptions[option.id] = `${option.assignmentCountry}(${option.startDate} - ${option.actualEndDate})`
            }
        }
        return preparedOptions;
    }
}


export default App;
