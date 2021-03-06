// SCRIPT FOR PROCESSING CFPB DATA

// Make all forms match whatever the query is, to retain state.
function replaceForms(value, key){
    const el = document.getElementById(key);
    el.value = value;
};

const queryString = window.location.search;
const params = new URLSearchParams(queryString);

let lens = '';
let minDate = '';
let trendInterval = ''

if (queryString){
    
    // Make all forms match whatever the query is, to retain state.
    params.forEach((value, key) => replaceForms(value, key));

    // Set minimum date for tables.
    minDate = new Date(params.get('date_received_min'));
    lens = params.get('lens');
    trendInterval = params.get('trend_interval');

    // now fetch the CFPB response
    fetch('scripts/query_cfpb.php' + location.search)
        .then(response => response.json())
        .then(jsonData => {
            
            const requestUrl = jsonData[0];
            const data = jsonData[1];

            // Load total # of complaints to page
            total_complaints_div = document.createElement('div');    
            
            if (['overview', 'product'].includes(lens)) {
                total_complaints = data['aggregations']['dateRangeArea']['doc_count'].toLocaleString();
            } else if (['geography'].includes(lens)) {
                total_complaints = data['aggregations']['state']['doc_count'].toLocaleString();
            }
            
            total_complaints_div.innerHTML = `<strong>Total complaints:</strong> ${total_complaints}`;
            document.getElementById('results').appendChild(total_complaints_div);

            
            // create complaints by product table
            const byProduct = data['aggregations']['product']['product']['buckets'];
            const byProductOther = data['aggregations']['product']['product']['sum_other_doc_count'];    
            makeTable('Complaints by product', 'complaints_by_product', ['Product', 'Complaints'], byProduct, byProductOther);

            // complaints by state table
            if (lens == 'geography') {
                const byState = data['aggregations']['state']['state']['buckets'];
                makeTable('Complaints by state', 'complaints_by_state', ['State', 'Complaints'], byState);
            };
            
            // create complaints by issue table
            if (lens == 'product'){
                const byIssue = data['aggregations']['issue']['issue']['buckets'];
                const byIssueOther = data['aggregations']['issue']['issue']['sum_other_doc_count'];    
                makeTable('Complaints by issue', 'complaints_by_issue', ['Issue', 'Complaints'], byIssue, byIssueOther);
            };

            // create complaints by sub-product table
            if (lens == 'product'){
                const bySubProduct = data['aggregations']['sub-product']['sub-product']['buckets'];    
                makeTable('Complaints by sub-product', 'complaints_by_subproduct', ['Sub-product', 'Complaints'], bySubProduct);
            };
            
            // create the complaints by date table.        
            
            if (['overview', 'product'].includes(lens)) {
                const byDate = data['aggregations']["dateRangeArea"]['dateRangeArea']["buckets"];
                makeTable(`Complaints by ${trendInterval}`, 'complaints_by_date', ['Period beginning', 'Complaints'], byDate); 
            };

            // create complaints by sub-product by date table
            if (lens == 'product'){
                const bySubProductByDate = data['aggregations']['sub-product']['sub-product']['buckets'];    
                makeMultiTable(`Complaints by sub-product by ${trendInterval}`, 'complaints_by_subproduct_by_date', ['Sub-product', 'Period beginning', 'Complaints'], bySubProductByDate);
            };

            // link to full api response  
            const responseDiv = document.createElement('div');
            responseDiv.style.margin='10px 0px';
        
            const responseA = document.createElement('a')
            responseA.href = requestUrl;
            responseA.innerText = 'View raw JSON response string from CFPB';
            responseA.target = '_blank';
            responseA.style.fontStyle = 'italic';
        
            responseDiv.appendChild(responseA);
            document.getElementById('results').appendChild(responseDiv); 
            });

    } else {
        // if no params, set default max date to today, and default min date to last year.
        dateMax = new Date();
        dateMin = new Date();
        dateMin.setFullYear(dateMin.getFullYear()-2);
        document.getElementById('date_received_min').value = dateMin.toLocaleDateString('en-CA');
        document.getElementById('date_received_max').value = dateMax.toLocaleDateString('en-CA');

        
        // add page instructions
        instructions = document.createElement('p');
                instructions.innerHTML = '<em>Submit options to view trend data.</em>';
                document.getElementById('results').appendChild(instructions);
      };
      