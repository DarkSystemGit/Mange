//driver assignment, (order table, driver ids)
export const doAssignments=(orders,drivers) => {
    let delivs = {};
    let overflow = [];
    let delivAssignments = {};
    let divs=[...drivers];
    const driverCapacity = 5;
    Object.values(orders).forEach(order => {
        order.items.forEach(item => {
            if (delivs[item.restaurantId] == undefined) {
                delivs[item.restaurantId] = [];
            }
            delivs[item.restaurantId].push({ orderId: order.id, itemId: item.id, quantity: item.quantity, user: order.user, price: item.price*item.quantity });
        })
    });
    Object.values(delivs).forEach((restOrder, i )=> {
        if (restOrder.length > driverCapacity) {
            let overflowOrders = restOrder.slice(driverCapacity);
            restOrder = restOrder.slice(0, driverCapacity);
            overflowOrders.forEach(order => {
                order.rest = Object.keys(delivs)[i];
                overflow.push(order);
            })
        }
        restOrder.forEach(order => {
            order.rest = Object.keys(delivs)[i];
            if (divs.length == 0) {
                overflow.push(order);
                return;
            }
            let driver = divs.pop();
            if (delivAssignments[driver] == undefined) {
                delivAssignments[driver] = [];
            }
            delivAssignments[driver].push(order);
        })
    })
    let oc=0;
    while(overflow.length !=oc) {
    divs=[...drivers];
    overflow.forEach(order => {
        oc++
        let driver = divs.pop();
        delivAssignments[driver].push(order);
    })}
    const fill=Object.values(delivAssignments).map((o)=>{
        let total = 0;
        let locations=[];
        o.forEach(order => {
            total += order.price;
            if(!locations.includes(order.rest)){
                locations.push(order.rest);
            }
        })
        return {orders: o, total: total, locations}
    });
    Object.keys(delivAssignments).forEach((driver,i) => {
        delivAssignments[driver]=fill[i];
    })
    return delivAssignments;
}
