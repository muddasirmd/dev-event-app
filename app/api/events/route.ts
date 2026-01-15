import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {

    try{
        await connectDB();

        const formaData = await req.formData();

        let event;

        try{
            // Parse Data
            event = Object.fromEntries(formaData.entries());
        } catch(e){
            return NextResponse.json({message: 'Invalid JSON data format'}, {status: 400})
        }

        // Image Upload to Cloudinary
        const file = formaData.get('image') as File;

        if(!file){
            return NextResponse.json({message: 'Image file is required'}, {status: 400})
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({resource_type: 'image', folder: 'dev-events'}, (error, result) => {
                if (error) return reject(error);

                resolve(result);
            }).end(buffer);
        });
        
        event.image = (uploadResult as {secure_url: string}).secure_url;
        
        const createdEvent = await Event.create(event);

        return NextResponse.json({message: 'Event created successfully', event: createdEvent}, {status: 201});
    } 
    catch(e){
        console.log(e);
        return NextResponse.json({message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, {status: 500})
    }
}

export async function GET() {
    try{
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({message: "Events Fetched Successfully", events}, {status: 200})
    }
    catch(e) {
        return NextResponse.json({message: "Event fetching failed", error: e}, {status: 500})
    }
}