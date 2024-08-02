const generateInvoiceHTML = (data) => {
  // Sample data

  // Inline styles
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      marginBottom:'30px',
      width:'520px',
      margin: 'auto',
      paddingRight:'10px',
      borderRadius: '8px',
      background:'#fff'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '5px',
    },
    logo: {
      maxWidth: '50px',
      maxHeight: '50px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '10px',
    },
    th: {
      border: '1px solid #ddd',
      padding: '4px',
      textAlign: 'left',
      background: '#f2f2f2',
      fontSize:'10px',
    },
    td: {
      border: '1px solid #ddd',
      padding: '4px',
      fontSize:'8px',
    },
    total: {
      textAlign: 'right',
      fontSize:'12px',
      fontWeight:'600'
    },
  };

  const date = (createdOnString) => {
    // Assuming createdOn is a date string or a Date object
    const createdOn = new Date(createdOnString); // Replace this with your actual date
  
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
// Use 24-hour format
    };
  
    const formattedDateTime = new Intl.DateTimeFormat('en-US', options).format(createdOn);
  
    return `${formattedDateTime}`;
  };

  let invoiceHTML = `
    <div style="${generateInlineStyles(styles.container)}">
      <div style="${generateInlineStyles(styles.header)}">
        
        <!-- <img src={Logo} alt="Logo" style=${generateInlineStyles(styles.logo)} /> -->
        <div>
          <h1 style="font-weight:600;font-size:24px;">INVOICE</h1>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between">
        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;">Hello, ${data?.hoteData?.fullName}.<br/>Thank you for shopping from Freshopure and for your order.</p>

        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;text-align:right">Order #${data?.orderId} <br/> ${date(data?.orderDate)}</p>

      </div>

      <div style="display:flex;margin-bottom:10px">
        <div style="border:1px solid #ddd ;flex:1;margin-right:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">Shvaas Sustainable Solutions Private Limited</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          Bhamashah Techno Hub 2 Floor
          Sansthan Path, Jhalana Gram , Malviya Nagar, Jaipur
          Rajasthan
          302017
          </p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          GSTIN/UIN: 08ABFCS1307P1Z2
          </p> 
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : Rajasthan, Code : 08
          </p>
        </div>

        <div style="border:1px solid #ddd ;flex:1;margin-left:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">${data?.hoteData?.hotelName}</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          ${data?.userAddress}
          302017
          </p>
          
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : Rajasthan, Code : 08
          </p>
        </div>

      </div>

      <table style="${generateInlineStyles(styles.table)}">
        <thead>
          <tr>
            <th style="${generateInlineStyles(styles.th)}">Item Name</th>
            <th style="${generateInlineStyles(styles.th)}">Quantity</th>
            <th style="${generateInlineStyles(styles.th)}">Unit Price</th>
            <th style="${generateInlineStyles(styles.th)}">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data?.itemsData?.map((item, index) => `
            <tr key=${index}>
              <td style="${generateInlineStyles(styles.td)}">${item.itemName}</td>
              <td style="${generateInlineStyles(styles.td)}">${item.quantity?.kg} Kg   ${item?.quantity?.gram} Grams</td>
              <td style="${generateInlineStyles(styles.td)}">${item.price}</td>
              <td style="${generateInlineStyles(styles.td)}">${item.price*item.quantity?.kg + item.price*(item.quantity?.gram/1000)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="${generateInlineStyles(styles.total)}">
        <p>Total:$${data?.price}</p>
      </div>

      <div style="display:flex;margin-bottom:10px;margin-top:20px">
        <div style="flex:1;margin-right:5px">
          <p style="font-weight:600;font-size:10px;">Declaration</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:10px">
          We declare that this invoice shows the actual price of the 
          goods described and that all particulars are true and 
          correct
          </p>
         
        </div>

        <div style="flex:1;margin-right:5px;text-align:right">
          <p style="font-weight:600;font-size:10px;">for Shvaas Sustainable Solutions Private Limited</p>
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:30px;text-align:right">
          Authorised Signatory
          </p>
        </div>

      </div>

    </div>
  `;

  return invoiceHTML;
};

// Function to convert styles object to inline styles
const generateInlineStyles = (styles) => {
  return Object.keys(styles).map(key => `${key}:${styles[key]}`).join(';');
};

const generateHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Generated HTML</title>
    </head>
    <body>
      <h1>Hello, ${data.name}!</h1>
      <p>This is a dynamically generated HTML content.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </body>
    </html>
  `;
};

const data = {
  name: 'John'
};

// const htmlContent = generateHTML(data);
// console.log(htmlContent);

module.exports = generateHTML;