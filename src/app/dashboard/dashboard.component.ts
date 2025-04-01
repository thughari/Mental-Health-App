import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HealthService } from '../health.service';
import { LogoutService } from '../logout.service';

export interface CustomField {
    name: string;
    value: any;
}

export interface HealthData {
    steps: number;
    caloriesBurned: number;
    sleepHours: number;
    heartRate: number;
    systolicBloodPressure: number;
    diastolicBloodPressure: number;
    customFields: CustomField[];
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    username: any;
    healthData: HealthData | undefined; //initialized to null
    showHealthForm = false;
    healthForm: FormGroup;
    isEditing = false;
    customFieldsFormArray: FormArray;
    storedUsername = localStorage.getItem('username');

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private healthService: HealthService,
        private logoutService: LogoutService
    ) {
       this.healthForm = this.fb.group({
            steps: ['', Validators.required],
            caloriesBurned: ['', Validators.required],
            sleepHours: ['', Validators.required],
            heartRate: ['', Validators.required],
            systolicBloodPressure: ['', Validators.required],
            diastolicBloodPressure: ['', Validators.required],
            customFields: this.fb.array([])  // customFields initialized in form builder
        });

        this.customFieldsFormArray = this.healthForm.get('customFields') as FormArray;  // Assign the formArray to be used into customMetricsFormArray
    }

    ngOnInit(): void {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            this.username = JSON.parse(storedUsername);

            this.healthService.getHealthData().subscribe(
                (data: HealthData) => {
                    this.healthData = data;
                     this.patchFormWithData();  // and patch the data
                },
                (error) => {
                    console.error('Error fetching health data:', error);
                    this.showHealthForm = true; //If it fails, just show form
                }
            );
        }
    }

    logout(): void {
        this.logoutService.logout();
    }

    onHealthFormSubmit(): void {
      if (this.healthForm.valid) {
          const customFieldsValue = (this.healthForm.get('customFields') as FormArray).controls.map((control: any) => control.value);
          const healthData = {
            ...this.healthForm.value,
            customFields: customFieldsValue,
          }

          this.healthService.saveOrUpdate(healthData).subscribe(
            (response: HealthData) => {
                console.log('Health data submitted successfully:', response);
                this.healthData = response; // save data
                this.showHealthForm = false;
                this.isEditing = false;
            },
            (error) => {
                console.error('Error submitting health data:', error);
            }
          );
        }
    }
  
    customFieldFormGroup(): FormGroup {
        return this.fb.group({
            name: ['', Validators.required],
            value: ['']
        });
    }

    addCustomField(): void {
        const customFieldsFormArray = this.healthForm.get('customFields') as FormArray;
        customFieldsFormArray.push(this.customFieldFormGroup());
    }

    deleteCustomField(index: number): void {
        const customFieldsFormArray = this.healthForm.get('customFields') as FormArray;
        customFieldsFormArray.removeAt(index);
    }
  
        //Set initial values to avoid undefined values
        patchFormWithData(): void {
            if (this.healthData) {

                this.showHealthForm = false; //if there is value disable and show results
                //set the main fields value to healthForm, you can change or do whatever.
                this.healthForm.patchValue({
                    steps: this.healthData.steps,
                    caloriesBurned: this.healthData.caloriesBurned,
                    sleepHours: this.healthData.sleepHours,
                    heartRate: this.healthData.heartRate,
                    systolicBloodPressure: this.healthData.systolicBloodPressure,
                    diastolicBloodPressure: this.healthData.diastolicBloodPressure,
                });

                 const customMetricsValue: FormArray = this.healthForm.get("customFields") as FormArray;
                     customMetricsValue.clear();
         
                    // Then add the customMetrics if it exists, it will set
                       if(this.healthData.customFields != undefined){
                          this.healthData.customFields.forEach(data => {
                          customMetricsValue.push(
                             this.fb.group({
                                 name: [data.name, Validators.required],
                                 value: [data.value]
                            })
                           );
                          });
                        }
                this.isEditing = false; //set the form as no editing
                console.log(this.healthData);
            }
           else{
            this.showHealthForm = true;
            this.isEditing = true;
        }
    }

    enableHealthEditMode(): void {
        this.showHealthForm = true;
        this.isEditing = true;
    }

    enableUserEditMode(): void {
        this.isEditing = true;
    }

   handleCancelClick(): void {
      this.isEditing = false;
      this.showHealthForm = false;
   }
}