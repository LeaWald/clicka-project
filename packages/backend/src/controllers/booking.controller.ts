import { BookingModel } from "../models/booking.model";
import { BookingService } from "../services/booking.service";
import { Request, Response } from "express";
import { updateEventOnChangeBooking } from "./googleCalendarBookingIntegration.controller";

export class BookingController {
    bookingservice = new BookingService();
    async createBook(req: Request, res: Response) {
        console.log('Received request to create book:', req.body);
        const bookData = req.body;
        console.log('Prepared book data:', JSON.stringify(bookData, null, 2));
        const book = new BookingModel(bookData);
        const result = await this.bookingservice.createBooking(book);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: "Failed to create user" });
        }
    }
    
       async getAllBooking(req: Request, res: Response) {
        const result = await this.bookingservice.getAllBooking();
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: "Failed to fetch booking" });
        }
    }


 async  updateBooking(req: Request, res: Response){
   console.log('Received request to update booking:', req.body);
      const bookingId = req.params.id;
            const updatedData = req.body;
            const updatedBooking = new BookingModel(updatedData);
            await updateEventOnChangeBooking(req, res);
        console.log('Prepared booking data:', JSON.stringify(updatedBooking, null, 2));
            const result = await BookingService.updateBooking(bookingId, updatedBooking);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(500).json({ error: "Failed to update booking" });
            }
}

 async  getBookingById(req: Request, res: Response){
    try{
        const getBooking = await BookingService.getBookingById(req.params.id ? req.params.id : null);
        res.json(getBooking);
    }
    catch(err){
res.status(500).json({massage:'err.massage'});
    }
}
 async  getBookingByEventId(req: Request, res: Response){
    try{
       const getBooking = await BookingService.getBookingByEventId(req.params.eventId);

        res.json(getBooking);
    }
    catch(err){
res.status(500).json({massage:'err.massage'});
    }
}

 async  deleteRoom(req: Request, res: Response) {
    try{
      const deleteBooking=await this.bookingservice.deleteBooking(req.params.id);
      res.json(deleteBooking);
    }
    catch(err){
      res.status(500).json({massage:'err.massage'});
    }
}
async  bookingApproval(req: Request, res: Response){
    try{
        const updateBooking=await this.bookingservice.bookingApproval(req.params.id);
         res.status(200).json(updateBooking);
    }
    catch(err){
       res.status(500).json({massage:'err.message'});
    }
}
}

 
